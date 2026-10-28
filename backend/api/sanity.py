"""Validation of uploaded patient data before it is used for processing.

Two scopes are checked at two different points in time:

* Intrinsic checks run on upload, on the single file that was just uploaded.
  The counterpart file is deliberately not inspected, because it may be missing
  (a stored dataset drops the real data) or still belong to the previous
  upload round.
* Pair checks run when processing is triggered, where both files are known to
  be available. They verify that the two tables describe the same patients.

All messages are single-line, human readable sentences that mention only file
labels, row numbers and column names. Technical details are logged server-side
and never returned to the client.
"""

import csv
import logging
import os
from typing import Dict, List, Optional, Tuple

import pandas as pd
from fastapi import HTTPException
from pandas.api.types import is_numeric_dtype, is_string_dtype

logger = logging.getLogger("uvicorn.info")

MAX_PROCESSING_ROWS = 1000
RANDOM_STATE = 42
MIN_COLUMN_OVERLAP = 0.5
MAX_DETAIL_LENGTH = 200
MAX_LISTED_ITEMS = 5
MIN_ROWS = 2
SMALL_SAMPLE_ROWS = 10
ROW_IMBALANCE_FACTOR = 10
HIGH_MISSING_RATIO = 0.5
MAX_TEXT_CARDINALITY = 100

IDENTIFIER_COLUMN = "SUBJID"


class SanityError(HTTPException):
    """A validation failure that is reported to the client as a 422 response."""

    def __init__(self, label: str, message: str):
        super().__init__(status_code=422, detail=f"{label}: {message}")
        self.label = label
        self.message = message


def _display(value: object, limit: int = 40) -> str:
    """Render a user-provided name on a single, printable line."""
    text = "".join(char if char.isprintable() else " " for char in str(value)).strip()
    if len(text) > limit:
        text = text[: limit - 1] + "…"
    return f"'{text}'"


def _short_list(items: List[str], total: int = None) -> str:
    listed = ", ".join(_display(item) for item in items[:MAX_LISTED_ITEMS])
    total = len(items) if total is None else total
    if total > MAX_LISTED_ITEMS:
        listed += f" and {total - MAX_LISTED_ITEMS} more"
    return listed


def summarize(messages: List[str], limit: int = MAX_DETAIL_LENGTH) -> str:
    """Join messages into a response detail that stays short.

    The frontend only shows details up to ``MAX_DETAIL_LENGTH`` characters, so
    the full list of findings belongs in the validation endpoint.
    """
    if not messages:
        return ""
    text = "; ".join(messages)
    if len(text) <= limit:
        return text
    remaining = len(messages) - 1
    head = messages[0]
    suffix = f" (and {remaining} more issue(s))" if remaining else ""
    return (head + suffix)[:limit].rstrip(" ,;") + "…"


def _scan_structure(path: str, label: str) -> Tuple[List[str], List[str]]:
    """Check the raw CSV structure that pandas would silently repair.

    Returns the column names as written and any warnings. Columns without a
    header name are reported and later dropped, because they cannot be matched
    across the two uploads. Raises :class:`SanityError` for files that cannot
    be interpreted as a table.
    """
    warnings: List[str] = []
    try:
        with open(path, newline="", encoding="utf-8-sig") as handle:
            reader = csv.reader(handle)
            try:
                header = next(reader)
            except StopIteration:
                raise SanityError(label, "the file is empty.")

            raw_names = [name.strip() for name in header]
            if not any(raw_names):
                raise SanityError(label, "the header line declares no column names.")

            names = raw_names
            unnamed = [str(index) for index, name in enumerate(names, start=1) if not name]
            if unnamed:
                positions = ", ".join(unnamed[:MAX_LISTED_ITEMS])
                if len(unnamed) > MAX_LISTED_ITEMS:
                    positions += f" and {len(unnamed) - MAX_LISTED_ITEMS} more"
                if len(unnamed) == 1:
                    warnings.append(
                        f"Column {positions} in the header of {label.lower()} has no name and is ignored."
                    )
                else:
                    warnings.append(
                        f"Columns {positions} in the header of {label.lower()} have no name and are ignored."
                    )

            seen = set()
            for name in names:
                if not name:
                    continue
                if name in seen:
                    raise SanityError(label, f"the column name {_display(name)} is used more than once.")
                seen.add(name)

            expected = len(header)
            for row in reader:
                if not row or all(not field.strip() for field in row):
                    continue
                if len(row) != expected:
                    raise SanityError(
                        label,
                        f"row {reader.line_num} has {len(row)} fields but the header declares {expected} columns.",
                    )
    except SanityError:
        raise
    except UnicodeDecodeError as error:
        logger.warning("Validation failed for %s: not UTF-8 (%s)", path, error)
        raise SanityError(label, "the file is not valid UTF-8 text.")
    except OSError as error:
        logger.warning("Validation failed for %s: unreadable (%s)", path, error)
        raise SanityError(label, "the file could not be read.")

    return names, warnings


def read_patient_csv(path: str, label: str) -> Tuple[pd.DataFrame, List[str]]:
    """Read a patient CSV, rejecting files that pandas would silently repair.

    Returns the frame together with structural warnings, such as columns that
    received a placeholder name because their header was empty.
    """
    names, warnings = _scan_structure(path, label)
    try:
        frame = pd.read_csv(path, encoding="utf-8-sig")
    except pd.errors.EmptyDataError as error:
        logger.warning("Validation failed for %s: empty file (%s)", path, error)
        raise SanityError(label, "the file is empty.")
    except pd.errors.ParserError as error:
        logger.warning("Validation failed for %s: parser error (%s)", path, error)
        raise SanityError(label, "the file could not be parsed as a CSV table.")
    except UnicodeDecodeError as error:
        logger.warning("Validation failed for %s: not UTF-8 (%s)", path, error)
        raise SanityError(label, "the file is not valid UTF-8 text.")
    except OSError as error:
        logger.warning("Validation failed for %s: unreadable (%s)", path, error)
        raise SanityError(label, "the file could not be read.")

    if frame.shape[1] == 0:
        raise SanityError(label, "the file declares no columns.")
    # Align headers across files even when one export writes "age" as " age".
    frame.columns = names
    # A column without a header name cannot be matched across uploads, so it is
    # reported as a warning and left out of every evaluation.
    frame = frame.drop(columns=[name for name in frame.columns if not name])
    if frame.shape[1] == 0:
        raise SanityError(label, "the file declares no named columns.")
    if frame.shape[0] == 0:
        raise SanityError(label, "the file has a header but no data rows.")
    if frame.shape[0] < MIN_ROWS:
        raise SanityError(label, f"the file contains {frame.shape[0]} data row(s) but at least {MIN_ROWS} are required.")
    return frame, warnings


def _intrinsic_warnings(frame: pd.DataFrame, label: str) -> List[str]:
    warnings: List[str] = []
    rows = frame.shape[0]

    if rows > MAX_PROCESSING_ROWS:
        warnings.append(
            f"{label} has {rows:,} data rows. Metrics are computed on a random sample of "
            f"{MAX_PROCESSING_ROWS:,} rows."
        )
    elif rows < SMALL_SAMPLE_ROWS:
        warnings.append(
            f"{label} has only {rows:,} data rows; some metrics may not be computable."
        )

    empty_columns = [str(column) for column in frame.columns if frame[column].isna().all()]
    if empty_columns:
        warnings.append(f"Columns {_short_list(empty_columns)} in {label.lower()} contain no values.")

    total_values = rows * frame.shape[1]
    missing = int(frame.isna().sum().sum())
    if total_values and missing / total_values > HIGH_MISSING_RATIO:
        warnings.append(
            f"More than {int(HIGH_MISSING_RATIO * 100)}% of the values in {label.lower()} are missing; "
            "only complete rows can be used."
        )

    text_columns = []
    for column in frame.columns:
        series = frame[column]
        if is_string_dtype(series.dtype) and series.nunique(dropna=True) > MAX_TEXT_CARDINALITY:
            text_columns.append(str(column))
    if text_columns:
        warnings.append(
            f"Columns {_short_list(text_columns)} in {label.lower()} look like free text "
            f"(more than {MAX_TEXT_CARDINALITY} distinct values)."
        )

    return warnings


def validate_upload(path: str, label: str) -> Tuple[int, List[str]]:
    """Run intrinsic checks on a single uploaded file.

    Returns the number of data rows and a list of warnings. Raises
    :class:`SanityError` when the file cannot be used at all.
    """
    frame, warnings = read_patient_csv(path, label)
    return frame.shape[0], warnings + _intrinsic_warnings(frame, label)


def _evaluated_columns(frame: pd.DataFrame) -> List[str]:
    return [column for column in frame.columns if column != IDENTIFIER_COLUMN]


def _pair_findings(real: pd.DataFrame, virtual: pd.DataFrame) -> Tuple[List[str], List[str], List[str]]:
    """Compare the two tables and return errors, warnings and shared columns."""
    errors: List[str] = []
    warnings: List[str] = []

    real_columns = _evaluated_columns(real)
    virtual_columns = _evaluated_columns(virtual)
    shared = sorted(set(real_columns) & set(virtual_columns))
    widest = max(len(real_columns), len(virtual_columns))

    if not shared:
        errors.append("Real and synthetic data share no column names.")
        return errors, warnings, shared

    if len(shared) / widest < MIN_COLUMN_OVERLAP:
        errors.append(
            f"Real and synthetic data share only {len(shared)} of {widest} columns; "
            "at least half of the column names must match."
        )

    for side, columns in (("real", real_columns), ("synthetic", virtual_columns)):
        ignored = [column for column in columns if column not in shared]
        if ignored:
            counterpart = "synthetic" if side == "real" else "real"
            warnings.append(
                f"{len(ignored)} column(s) in {side} data are ignored because they are missing "
                f"from the {counterpart} data: {_short_list(ignored)}."
            )

    mismatched = [
        column
        for column in shared
        if is_numeric_dtype(real[column]) != is_numeric_dtype(virtual[column])
    ]
    if mismatched:
        warnings.append(
            f"Columns {_short_list(mismatched)} are numeric in one file and text in the other."
        )

    real_rows, virtual_rows = real.shape[0], virtual.shape[0]
    smallest = min(real_rows, virtual_rows)
    if smallest > 0 and max(real_rows, virtual_rows) / smallest > ROW_IMBALANCE_FACTOR:
        warnings.append(
            f"Real data has {real_rows:,} rows while synthetic data has {virtual_rows:,} rows."
        )

    return errors, warnings, shared


def _subsample(frame: pd.DataFrame, row_limit: Optional[int]) -> pd.DataFrame:
    if row_limit is None or frame.shape[0] <= row_limit:
        return frame
    return frame.sample(n=row_limit, random_state=RANDOM_STATE)


def load_prepared_pair(directory: str, row_limit: Optional[int] = MAX_PROCESSING_ROWS):
    """Read, validate and align the real and synthetic patient tables.

    Raises a 422 response when the pair cannot be processed. Warnings are
    logged because the caller only cares about usable frames.
    """
    real_path = os.path.join(directory, "real.csv")
    synthetic_path = os.path.join(directory, "synthetic.csv")

    for path, label in ((real_path, "Real data"), (synthetic_path, "Synthetic data")):
        if not os.path.isfile(path):
            raise SanityError(label, "has not been uploaded yet.")

    real, real_warnings = read_patient_csv(real_path, "Real data")
    virtual, virtual_warnings = read_patient_csv(synthetic_path, "Synthetic data")

    errors, warnings, shared = _pair_findings(real, virtual)
    if errors:
        raise SanityError("Patient data", summarize(errors))
    for warning in real_warnings + virtual_warnings + warnings:
        logger.info("Patient data warning: %s", warning)

    real = real[[column for column in shared]]
    virtual = virtual[[column for column in shared]]
    if real.shape[0] == 0 or virtual.shape[0] == 0:
        raise SanityError("Patient data", "one of the files contains no usable rows.")

    return _subsample(real, row_limit), _subsample(virtual, row_limit)


def build_report(directory: str, row_limit: int = MAX_PROCESSING_ROWS) -> Dict[str, object]:
    """Build the report served to the frontend before processing starts.

    Missing files and invalid tables are reported as data instead of transport
    errors, so the caller can explain the problem in a single place.
    """
    real_path = os.path.join(directory, "real.csv")
    synthetic_path = os.path.join(directory, "synthetic.csv")

    errors: List[str] = []
    warnings: List[str] = []
    frames: Dict[str, Optional[pd.DataFrame]] = {"real": None, "synthetic": None}

    for key, path, label in (
        ("real", real_path, "Real data"),
        ("synthetic", synthetic_path, "Synthetic data"),
    ):
        if not os.path.isfile(path):
            errors.append(f"{label} has not been uploaded yet.")
            continue
        try:
            frame, structure_warnings = read_patient_csv(path, label)
        except SanityError as error:
            errors.append(error.detail)
            continue
        frames[key] = frame
        warnings.extend(structure_warnings)
        warnings.extend(_intrinsic_warnings(frame, label))

    shared: List[str] = []
    ignored: Dict[str, List[str]] = {"real": [], "synthetic": []}
    real, virtual = frames["real"], frames["synthetic"]
    if real is not None and virtual is not None:
        pair_errors, pair_warnings, shared = _pair_findings(real, virtual)
        errors.extend(pair_errors)
        warnings.extend(pair_warnings)
        ignored["real"] = [column for column in _evaluated_columns(real) if column not in shared]
        ignored["synthetic"] = [column for column in _evaluated_columns(virtual) if column not in shared]

    real_rows = None if real is None else int(real.shape[0])
    synthetic_rows = None if virtual is None else int(virtual.shape[0])
    processing_rows = None
    if real is not None and virtual is not None and not errors:
        processing_rows = min(row_limit, real_rows, synthetic_rows)

    return {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "details": {
            "real_rows": real_rows,
            "synthetic_rows": synthetic_rows,
            "processing_rows": processing_rows,
            "max_processing_rows": row_limit,
            "shared_columns": len(shared),
            "ignored_columns": ignored,
        },
    }
