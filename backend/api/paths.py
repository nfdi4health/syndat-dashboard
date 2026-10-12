import os
import re

from fastapi import HTTPException

DATASETS_ROOT = "datasets"

_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


def dataset_dir(identifier: str) -> str:
    """Resolve a user-provided dataset identifier to a safe directory path.

    The identifier must be a simple name without path separators or traversal
    segments, and the resolved path must stay contained within the datasets
    root. Both checks are required: the allowlist rejects traversal segments
    outright, and the containment check guarantees the result cannot escape
    the root even if the allowlist is ever relaxed.
    """
    if not identifier or not _IDENTIFIER_PATTERN.match(identifier):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    root = os.path.realpath(DATASETS_ROOT)
    candidate = os.path.realpath(os.path.join(root, identifier))
    if candidate != root and not candidate.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    return candidate


def safe_component(name: str) -> str:
    """Validate a single path component such as a plot name."""
    component = os.path.basename(name)
    if not component or not _IDENTIFIER_PATTERN.match(component):
        raise HTTPException(status_code=400, detail="Invalid path component.")
    return component
