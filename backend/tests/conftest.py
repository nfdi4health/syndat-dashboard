import csv
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from api.routes import app


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    """Run the API against a disposable, minimal dataset tree."""
    datasets = tmp_path / "datasets"
    default = datasets / "default"
    patients = default / "patients"
    results = default / "results"
    plots = default / "plots" / "violin"
    patients.mkdir(parents=True)
    results.mkdir()
    plots.mkdir(parents=True)
    (default / "plots" / "correlation").mkdir()

    rows = [
        {"SUBJID": "1", "age": "30", "sex": "F"},
        {"SUBJID": "2", "age": "40", "sex": "M"},
    ]
    for filename in ("real.csv", "synthetic.csv"):
        with (patients / filename).open("w", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=rows[0])
            writer.writeheader()
            writer.writerows(rows)

    for name, value in {
        "auc": 0.25,
        "jsd": 0.5,
        "norm": 0.75,
        "risk_singling_out": 0.1,
        "risk_linkability": 0.2,
        "risk_inference": 0.3,
    }.items():
        np.save(results / f"{name}.npy", value)
    np.save(results / "anomaly_scores.npy", np.array([0.2, 0.8]))
    for name, value in {
        "x_real": [[1.0, 2.0]],
        "y_real": [3.0],
        "x_virtual": [[4.0, 5.0]],
        "y_virtual": [6.0],
    }.items():
        np.save(results / f"{name}.npy", np.array(value))

    (datasets / "other").mkdir()
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("SYNDAT_ADMIN_USERNAME", "test-admin")
    monkeypatch.setenv("SYNDAT_ADMIN_PASSWORD", "test-password")

    with TestClient(app) as client:
        yield client
