import os
import re

from fastapi import HTTPException

DATASETS_ROOT = "datasets"

_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


def datasets_root() -> str:
    """Absolute, normalized datasets root directory."""
    return os.path.realpath(DATASETS_ROOT)


def validate_identifier(identifier: str) -> None:
    """Reject dataset identifiers that are not a single simple path component."""
    if not identifier or not _IDENTIFIER_PATTERN.match(identifier):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")


def resolve_dataset_path(identifier: str, *parts: str):
    """Normalize a dataset path built from a user-provided identifier.

    Returns the normalized datasets root together with the normalized candidate
    path. Callers are expected to verify that the candidate is contained in the
    root with an in-function ``startswith`` guard before using it.
    """
    validate_identifier(identifier)
    root = datasets_root()
    candidate = os.path.realpath(os.path.join(root, identifier, *parts))
    return root, candidate


def dataset_dir(identifier: str) -> str:
    """Resolve a user-provided dataset identifier to a safe directory path."""
    root, candidate = resolve_dataset_path(identifier)
    if candidate != root and not candidate.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    return candidate


def safe_component(name: str) -> str:
    """Validate a single path component such as a plot name."""
    component = os.path.basename(name)
    if not component or not _IDENTIFIER_PATTERN.match(component):
        raise HTTPException(status_code=400, detail="Invalid path component.")
    return component
