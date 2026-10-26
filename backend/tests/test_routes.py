import io
import json
import zipfile


def test_info_endpoints_are_deterministic(api_client):
    assert api_client.get("/version").json() == "1.0.0"
    assert api_client.get("/datasets").json() == ["other"]
    assert api_client.get("/error").status_code == 204


def test_synthetic_patient_and_column_types(api_client):
    patient = api_client.get("/datasets/default/patients/synthetic/0")
    assert patient.status_code == 200
    assert patient.json() == {"SUBJID": "1", "age": 30, "sex": "F"}

    columns = api_client.get("/datasets/default/patients/synthetic")
    assert columns.status_code == 200
    assert columns.json() == [
        {"name": "age", "datatype": "int64", "options": None, "minval": 30.0, "maxval": 40.0},
        {"name": "sex", "datatype": "object", "options": ["F", "M"], "minval": None, "maxval": None},
    ]


def test_last_update_endpoints(api_client):
    for resource in ("patients/real", "patients/synthetic", "results"):
        response = api_client.get(f"/datasets/default/{resource}/last-update")
        assert response.status_code == 200, resource
        assert isinstance(response.json(), (int, float)), resource


def test_scores_and_risk_results(api_client):
    assert api_client.get("/datasets/default/scores").json() == {
        "auc": 0.25,
        "jsd": 0.5,
        "norm": 0.75,
    }
    assert api_client.get("/datasets/default/results/auc").json() == {
        "auc_score": 0.25,
        "real_rows": 2,
        "total_real_rows": 2,
    }
    assert api_client.get("/datasets/default/results/risk_inference").json() == {"risk": 0.3}
    assert api_client.get("/datasets/default/results/outliers?anomaly_score=true").json() == {
        "Outlier_Scores": [0.2, 0.8]
    }


def test_auc_omits_real_row_counts_for_older_datasets(api_client):
    import os

    os.remove("datasets/default/results/real_row_counts.npy")
    response = api_client.get("/datasets/default/results/auc")
    assert response.status_code == 200
    assert response.json() == {
        "auc_score": 0.25,
        "real_rows": None,
        "total_real_rows": None,
    }


def test_non_finite_scores_serialize_as_null(api_client):
    import numpy as np

    np.save("datasets/default/results/norm.npy", np.nan)
    response = api_client.get("/datasets/default/results/norm")
    assert response.status_code == 200
    assert response.json() == {"norm": None}

    np.save("datasets/default/results/auc.npy", np.inf)
    response = api_client.get("/datasets/default/results/auc")
    assert response.status_code == 200
    assert response.json()["auc_score"] is None


def test_tsne_result(api_client):
    assert api_client.get("/datasets/default/results/tsne").json() == {
        "trace_real": {"x": [[1.0, 2.0]], "y": [3.0]},
        "trace_virtual": {"x": [[4.0, 5.0]], "y": [6.0]},
    }


def test_search_filters_synthetic_patients(api_client):
    response = api_client.post(
        "/datasets/default/patients/synthetic/search",
        json={"constraints": [{"name": "sex", "category": "F"}]},
    )
    assert response.status_code == 200
    assert json.loads(response.text) == [{"SUBJID": "1", "age": 30, "sex": "F"}]


def test_dataset_identifier_traversal_is_rejected(api_client):
    for path in (
        "/datasets/../default/scores",
        "/datasets/..%2f..%2fetc/results/auc",
        "/datasets/..%2fdefault/scores",
        "/datasets/a%00b/scores",
        "/datasets/default/plots/violin/..%2f..%2f..%2fetc%2fpasswd",
    ):
        response = api_client.get(path)
        assert response.status_code in (400, 404), f"{path} -> {response.status_code}"


def test_valid_dataset_identifiers_still_work(api_client):
    assert api_client.get("/datasets/default/scores").status_code == 200
    assert api_client.get("/datasets/other/results/auc").status_code == 404


def test_import_rejects_zip_slip_archive(api_client):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("../evil.txt", b"pwned")
    buffer.seek(0)
    response = api_client.post(
        "/datasets/import",
        auth=("test-admin", "test-password"),
        files={"file": ("datasets.zip", buffer.read(), "application/zip")},
    )
    assert response.status_code == 400


def test_protected_import_requires_basic_auth(api_client):
    response = api_client.post(
        "/datasets/import",
        files={"file": ("datasets.zip", b"not a zip", "application/zip")},
    )
    assert response.status_code == 401

    response = api_client.post(
        "/datasets/import",
        auth=("test-admin", "test-password"),
        files={"file": ("datasets.txt", b"not a zip", "text/plain")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid file type. Only .zip files are accepted."
