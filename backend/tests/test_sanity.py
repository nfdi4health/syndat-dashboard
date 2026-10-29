import os

import pandas as pd
import pytest
from fastapi import HTTPException

from api import sanity


def write(path, content):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        handle.write(content)
    return str(path)


def pair_directory(tmp_path, real, synthetic):
    directory = tmp_path / "patients"
    directory.mkdir()
    write(directory / "real.csv", real)
    write(directory / "synthetic.csv", synthetic)
    return str(directory)


VALID = "SUBJID,age,sex\n1,30,F\n2,40,M\n"


def test_valid_upload_is_accepted_and_flags_tiny_samples(tmp_path):
    rows, warnings = sanity.validate_upload(write(tmp_path / "real.csv", VALID), "Real data")
    assert rows == 2
    assert warnings == ["Real data has only 2 data rows; some metrics may not be computable."]


@pytest.mark.parametrize(
    "content, expected",
    [
        ("", "the file is empty"),
        ("SUBJID,age,sex\n", "header but no data rows"),
        ("SUBJID,age,sex\n1,30,F\n", "at least 2 are required"),
        ("SUBJID,age,age\n1,30,31\n2,40,41\n", "used more than once"),
        ("SUBJID,age,sex\n1,30,F\n2,40\n", "row 3 has 2 fields but the header declares 3 columns"),
        ("SUBJID,age,sex\n1,30,F,extra\n2,40,M\n", "row 2 has 4 fields"),
    ],
)
def test_intrinsic_errors_are_reported_without_leaking_internals(tmp_path, content, expected):
    path = write(tmp_path / "real.csv", content)
    with pytest.raises(HTTPException) as raised:
        sanity.validate_upload(path, "Real data")
    assert raised.value.status_code == 422
    assert expected in raised.value.detail
    assert str(tmp_path) not in raised.value.detail
    assert "Traceback" not in raised.value.detail


def test_unnamed_header_column_is_ignored_with_a_warning(tmp_path):
    path = write(tmp_path / "real.csv", "SUBJID,,sex\n1,30,F\n2,40,M\n")

    count, warnings = sanity.validate_upload(path, "Synthetic data")

    assert count == 2
    assert "Column 2 in the header of synthetic data has no name and is ignored." in warnings
    frame, _ = sanity.read_patient_csv(path, "Synthetic data")
    assert list(frame.columns) == ["SUBJID", "sex"]


def test_large_upload_warns_about_sampling(tmp_path):
    rows = "\n".join(f"{index},{20 + index},F" for index in range(1, 1201))
    path = write(tmp_path / "big.csv", "SUBJID,age,sex\n" + rows + "\n")

    count, warnings = sanity.validate_upload(path, "Real data")

    assert count == 1200
    assert any("random sample of 1,000 rows" in warning for warning in warnings)


def test_upload_warnings_cover_empty_columns_missing_values_and_free_text(tmp_path):
    rows = "\n".join(f"{index},,text-{index}" for index in range(1, 140))
    path = write(tmp_path / "warn.csv", "SUBJID,age,note\n" + rows + "\n")

    _, warnings = sanity.validate_upload(path, "Real data")

    assert any("contain no values" in warning for warning in warnings)
    assert any("look like free text" in warning for warning in warnings)


def test_header_whitespace_is_trimmed_before_comparison(tmp_path):
    directory = pair_directory(tmp_path, "SUBJID, age,sex\n1,30,F\n2,40,M\n", "SUBJID,age, sex\n1,31,F\n2,41,M\n")

    report = sanity.build_report(directory)

    assert report["valid"] is True
    assert report["details"]["shared_columns"] == 2
    assert report["details"]["ignored_columns"] == {"real": [], "synthetic": []}


def test_pair_with_no_shared_columns_is_rejected(tmp_path):
    directory = pair_directory(tmp_path, "a,b\n1,2\n3,4\n", "c,d\n1,2\n3,4\n")
    with pytest.raises(HTTPException) as raised:
        sanity.load_prepared_pair(directory)
    assert raised.value.status_code == 422
    assert "share no column names" in raised.value.detail


def test_pair_with_low_overlap_is_rejected(tmp_path):
    directory = pair_directory(tmp_path, "a,b,c,d\n1,2,3,4\n5,6,7,8\n", "a,x,y,z\n1,2,3,4\n5,6,7,8\n")
    with pytest.raises(HTTPException) as raised:
        sanity.load_prepared_pair(directory)
    assert "share only 1 of 4 columns" in raised.value.detail


def test_partial_overlap_warns_and_aligns_shared_columns(tmp_path):
    directory = pair_directory(
        tmp_path,
        "SUBJID,age,sex,site\n1,30,F,a\n2,40,M,b\n",
        "SUBJID,age,sex,model\n1,31,F,x\n2,41,M,y\n",
    )
    report = sanity.build_report(directory)

    assert report["valid"] is True
    assert report["details"]["shared_columns"] == 2
    assert report["details"]["ignored_columns"] == {"real": ["site"], "synthetic": ["model"]}
    assert any("column(s) in real data are ignored" in warning for warning in report["warnings"])
    assert any("column(s) in synthetic data are ignored" in warning for warning in report["warnings"])

    real, virtual = sanity.load_prepared_pair(directory)
    assert list(real.columns) == ["age", "sex"]
    assert list(virtual.columns) == ["age", "sex"]


def test_type_mismatch_between_files_is_warned(tmp_path):
    directory = pair_directory(tmp_path, "age\n30\n40\n", "age\nunknown\nother\n")
    report = sanity.build_report(directory)
    assert any("numeric in one file and text in the other" in warning for warning in report["warnings"])


def test_row_imbalance_is_warned(tmp_path):
    real = "age\n" + "\n".join(str(index) for index in range(30)) + "\n"
    synthetic = "age\n1\n2\n"
    report = sanity.build_report(pair_directory(tmp_path, real, synthetic))
    assert any("rows while synthetic data has" in warning for warning in report["warnings"])


def test_pair_is_subsampled_deterministically(tmp_path):
    def frame_rows(count):
        return "SUBJID,age\n" + "\n".join(f"{index},{index}" for index in range(count)) + "\n"

    directory = pair_directory(tmp_path, frame_rows(1500), frame_rows(1500))
    real, virtual = sanity.load_prepared_pair(directory)
    real_again, virtual_again = sanity.load_prepared_pair(directory)

    assert real.shape == (1000, 1)
    assert virtual.shape == (1000, 1)
    assert real.equals(real_again)
    assert virtual.equals(virtual_again)
    assert set(real.index) != set(range(1000))


def test_row_limit_none_keeps_all_rows(tmp_path):
    content = "SUBJID,age\n" + "\n".join(f"{index},{index}" for index in range(1500)) + "\n"
    directory = pair_directory(tmp_path, content, content)

    real, virtual = sanity.load_prepared_pair(directory, row_limit=None)

    assert real.shape[0] == 1500
    assert virtual.shape[0] == 1500


def test_missing_file_is_reported_as_data_not_error(tmp_path):
    directory = tmp_path / "patients"
    directory.mkdir()
    write(directory / "synthetic.csv", VALID)

    report = sanity.build_report(str(directory))

    assert report["valid"] is False
    assert report["errors"] == ["Real data has not been uploaded yet."]
    assert report["details"]["real_rows"] is None


def test_report_reports_processing_rows(tmp_path):
    directory = pair_directory(tmp_path, VALID, VALID)
    report = sanity.build_report(directory)
    assert report["valid"] is True
    assert report["details"]["processing_rows"] == 2
    assert report["details"]["max_processing_rows"] == sanity.MAX_PROCESSING_ROWS


def test_evaluated_columns_ignore_identifier(tmp_path):
    directory = pair_directory(
        tmp_path,
        "SUBJID,age\n1,30\n2,40\n",
        "SUBJID,age\n1,30\n2,40\n",
    )
    real, virtual = sanity.load_prepared_pair(directory)
    assert "SUBJID" not in real.columns
    assert "SUBJID" not in virtual.columns
