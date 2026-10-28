import io
import json
import os
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


def _upload(client, data_type, content, filename="data.csv"):
    return client.post(
        f"/datasets/default/patients/{data_type}",
        files={"file": (filename, content.encode("utf-8"), "text/csv")},
    )


def test_upload_rejects_malformed_file_and_keeps_previous_data(api_client):
    original = open("datasets/default/patients/real.csv", encoding="utf-8").read()

    response = _upload(api_client, "real", "SUBJID,age,sex\n1,30,F\n2,40\n")

    assert response.status_code == 422
    assert "row 3 has 2 fields" in response.json()["detail"]
    assert open("datasets/default/patients/real.csv", encoding="utf-8").read() == original
    assert not [name for name in os.listdir("datasets/default/patients") if name.endswith(".upload")]


def test_upload_rejects_empty_file(api_client):
    response = _upload(api_client, "synthetic", "")
    assert response.status_code == 422
    assert "the file is empty" in response.json()["detail"]


def test_upload_returns_warnings_for_large_file(api_client):
    rows = "\n".join(f"{index},{20 + index},F" for index in range(1, 1201))
    response = _upload(api_client, "real", "SUBJID,age,sex\n" + rows + "\n")

    assert response.status_code == 200
    assert any("random sample of 1,000 rows" in warning for warning in response.json()["warnings"])


def test_upload_of_one_side_is_not_judged_against_stale_counterpart(api_client):
    # synthetic still holds the fixture schema; uploading a differently shaped
    # real file must succeed because alignment is only checked on processing.
    rows = "\n".join(f"{index},{index}" for index in range(1, 6))
    response = _upload(api_client, "real", "SUBJID,height\n" + rows + "\n")

    assert response.status_code == 200


def test_validation_endpoint_accepts_aligned_data(api_client):
    report = api_client.get("/datasets/default/patients/validation").json()

    assert report["valid"] is True
    assert report["errors"] == []
    assert report["details"]["real_rows"] == 2
    assert report["details"]["synthetic_rows"] == 2
    assert report["details"]["processing_rows"] == 2
    assert report["details"]["shared_columns"] == 2


def test_validation_endpoint_reports_missing_file(api_client):
    os.remove("datasets/default/patients/real.csv")

    report = api_client.get("/datasets/default/patients/validation").json()

    assert report["valid"] is False
    assert report["errors"] == ["Real data has not been uploaded yet."]


def test_validation_endpoint_reports_unrelated_datasets(api_client):
    with open("datasets/default/patients/synthetic.csv", "w", encoding="utf-8") as handle:
        handle.write("foo,bar\n1,2\n3,4\n")

    report = api_client.get("/datasets/default/patients/validation").json()

    assert report["valid"] is False
    assert "share no column names" in " ".join(report["errors"])


def test_processing_rejects_unrelated_datasets_without_writing_results(api_client):
    with open("datasets/default/patients/synthetic.csv", "w", encoding="utf-8") as handle:
        handle.write("foo,bar\n1,2\n3,4\n")

    response = api_client.patch("/datasets/default/results/column_types")

    assert response.status_code == 422
    assert "Patient data" in response.json()["detail"]
    assert not os.path.exists("datasets/default/results/column_types.npy")


def test_processing_runs_for_aligned_data(api_client):
    response = api_client.patch("/datasets/default/results/column_types")

    assert response.status_code == 201
    assert os.path.exists("datasets/default/results/column_types.npy")


def test_violin_processing_keeps_existing_plots_on_validation_failure(api_client):
    plot_path = "datasets/default/plots/violin/age.png"
    with open(plot_path, "wb") as handle:
        handle.write(b"existing")
    with open("datasets/default/patients/synthetic.csv", "w", encoding="utf-8") as handle:
        handle.write("foo,bar\n1,2\n3,4\n")

    response = api_client.patch("/datasets/default/plots/violin")

    assert response.status_code == 422
    assert os.path.exists(plot_path)
    assert not [name for name in os.listdir("datasets/default/plots") if name.startswith("violin-")]


def test_violin_processing_replaces_plots_on_success(api_client):
    plots = "datasets/default/plots/violin"
    with open(f"{plots}/stale.png", "wb") as handle:
        handle.write(b"stale")

    response = api_client.patch("/datasets/default/plots/violin")

    assert response.status_code == 201
    names = set(os.listdir(plots))
    assert "stale.png" not in names
    assert {"age.png", "sex.png"} <= names
    assert not [name for name in os.listdir("datasets/default/plots") if name.startswith("violin-")]
