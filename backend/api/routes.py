import io
import os
import shutil
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBasicCredentials

import numpy as np
import logging

import syndat
import pandas as pd

from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, RedirectResponse, Response

from api import processing
from api.data_loader import create_datasets_archive, extract_zip_safely, load_data_decoded, load_virtual_patients_decoded, validate_datasets_archive_structure
from api.filtering import get_column_types, get_similar_patients
from api.auth import authenticate_user, init_credentials
from api.paths import resolve_dataset_path, safe_component


app = FastAPI(
    title="SYNDAT API",
    description="API interface to access programmatic functionalities of SYNDAT.",
    version="1.0.0",
    terms_of_service="https://www.scai.fraunhofer.de/",
    contact={
        "name": "Prof. Dr. Holger Fröhlich",
        "email": "holger.froehlich@scai.fraunhofer.de",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ColumnTypeResponse(BaseModel):
    name: str
    datatype: str
    options: Optional[List[str]]
    minval: Optional[float]
    maxval: Optional[float]

    class Config:
        orm_mode = True


class ColumnConstraintDTO(BaseModel):
    name: str
    minval: Optional[float] = Field(None, description="Minimum value of the specified numeric column.")
    maxval: Optional[float] = Field(None, description="Maximum value of the specified numeric column.")
    category: Optional[str] = Field(None, description="Category filter, e.g. only male or female patients.")


class ColumnConstraintList(BaseModel):
    constraints: List[ColumnConstraintDTO]


logger = logging.getLogger("uvicorn.info")


def _json_safe_metric(value):
    """Convert a numpy scalar to JSON, mapping non-finite values to null."""
    value = float(value)
    return value if np.isfinite(value) else None


@app.on_event("startup")
async def startup_event():
    init_credentials()
    logger.info("Successfully initialized credentials.")

@app.get("/", include_in_schema=False)
def swagger_redirect():
    return RedirectResponse(url='/docs')


@app.get("/version", tags=["info"])
def get_current_version():
    return app.version


@app.get("/error", status_code=200, tags=["info"])
def get_error_log(response: Response):
    if os.path.isfile('error.txt'):
        with open('error.txt') as f:
            error = f.read()
        return {"content": error}
    else:
        response.status_code = 204
        return {"content": "No error occurred."}


@app.get("/datasets", tags=["info"])
def get_available_data_sets():
    datasets = [f for f in os.listdir("datasets") if os.path.isdir(os.path.join("datasets", f))]
    datasets_sorted = np.sort(datasets)
    datasets_sorted_without_default = np.delete(datasets_sorted, np.argwhere(datasets_sorted == "default"))
    return datasets_sorted_without_default.tolist()


@app.get("/datasets/{identifier}/patients/synthetic/{index:int}", tags=["results"])
def get_synthetic_patient(index: int, identifier: str):
    root, patients_dir = resolve_dataset_path(identifier, "patients")
    if not patients_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    return load_virtual_patients_decoded(patients_dir).loc[index].to_dict()


@app.get("/datasets/{identifier}/patients/synthetic", response_model=List[ColumnTypeResponse], tags=["results"])
def get_output_column_types(identifier: str):
    # drop ID column
    root, patients_dir = resolve_dataset_path(identifier, "patients")
    if not patients_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    virtual = load_virtual_patients_decoded(patients_dir).drop(columns='SUBJID', errors='ignore')
    column_types = get_column_types(virtual)
    return column_types


@app.get("/datasets/{identifier}/results/auc", tags=["results"])
def get_output_auc(identifier: str):
    # load from results if possible
    root, auc_path = resolve_dataset_path(identifier, "results", "auc.npy")
    if not auc_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(auc_path):
        auc_score = _json_safe_metric(np.load(auc_path).item())
        real_rows, total_real_rows = _load_real_row_counts(os.path.dirname(auc_path))
        return {
            "auc_score": auc_score,
            "real_rows": real_rows,
            "total_real_rows": total_real_rows,
        }
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


def _load_real_row_counts(results_dir):
    """Read persisted real-row counts, tolerating older datasets without the file."""
    counts_path = os.path.join(results_dir, "real_row_counts.npy")
    if not os.path.isfile(counts_path):
        return None, None
    counts = np.load(counts_path)
    if counts.shape[0] != 2:
        return None, None
    total_rows, usable_rows = int(counts[0]), int(counts[1])
    return usable_rows, total_rows


@app.get("/datasets/{identifier}/results/jsd", tags=["results"])
def get_output_jsd(identifier: str):
    root, jsd_path = resolve_dataset_path(identifier, "results", "jsd.npy")
    if not jsd_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(jsd_path):
        jsd_score = _json_safe_metric(np.load(jsd_path).item())
        return {"jsd_score": jsd_score}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/norm", tags=["results"])
def get_output_norm(identifier: str):
    root, norm_path = resolve_dataset_path(identifier, "results", "norm.npy")
    if not norm_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(norm_path):
        norm = _json_safe_metric(np.load(norm_path).item())
        return {"norm": norm}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/privacy", tags=["results"])
def get_privacy_score(identifier: str):
    # load from results if possible
    root, privacy_path = resolve_dataset_path(identifier, "results", "privacy_score.npy")
    if not privacy_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(privacy_path):
        privacy_score = _json_safe_metric(np.load(privacy_path).item())
        return {"privacy_score": privacy_score}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/outliers", tags=["results"])
def get_output_outliers(identifier: str, anomaly_score: bool):
    root, anomaly_path = resolve_dataset_path(identifier, "results", "anomaly_scores.npy")
    if not anomaly_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(anomaly_path):
        outliers = np.load(anomaly_path)
        if anomaly_score:
            return {"Outlier_Scores": outliers.tolist()}
        else:
            return {"outlier_indices": outliers.tolist()}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/tsne", tags=["results"])
def get_tsne_plotly_data(identifier: str):
    root, results_dir = resolve_dataset_path(identifier, "results")
    if not results_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    x_real_path = os.path.join(results_dir, "x_real.npy")
    x_virtual_path = os.path.join(results_dir, "x_virtual.npy")
    y_real_path = os.path.join(results_dir, "y_real.npy")
    y_virtual_path = os.path.join(results_dir, "y_virtual.npy")
    if os.path.isfile(x_real_path) \
            and os.path.isfile(x_virtual_path) \
            and os.path.isfile(y_real_path) \
            and os.path.isfile(y_virtual_path):
        x_real = np.load(x_real_path)
        x_virtual = np.load(x_virtual_path)
        y_real = np.load(y_real_path)
        y_virtual = np.load(y_virtual_path)
        trace_real = {"x": x_real.tolist(), "y": y_real.tolist()}
        trace_virtual = {"x": x_virtual.tolist(), "y": y_virtual.tolist()}
        return {"trace_real": trace_real, "trace_virtual": trace_virtual}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/risk_singling_out", tags=["results"])
def get_risk_singling_out(identifier: str):
    root, risk_path = resolve_dataset_path(identifier, "results", "risk_singling_out.npy")
    if not risk_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(risk_path):
        risk_singling_out = _json_safe_metric(np.load(risk_path).item())
        return {"risk": risk_singling_out}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/risk_linkability", tags=["results"])
def get_risk_linkability(identifier: str):
    root, risk_path = resolve_dataset_path(identifier, "results", "risk_linkability.npy")
    if not risk_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(risk_path):
        risk_linkability = _json_safe_metric(np.load(risk_path).item())
        return {"risk": risk_linkability}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/risk_inference", tags=["results"])
def get_risk_inference(identifier: str):
    root, risk_path = resolve_dataset_path(identifier, "results", "risk_inference.npy")
    if not risk_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if os.path.isfile(risk_path):
        risk_inference = _json_safe_metric(np.load(risk_path).item())
        return {"risk": risk_inference}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results", tags=["export"])
def export_results_set(identifier: str):
    root, results_dir = resolve_dataset_path(identifier, "results")
    if not results_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    output_zip = shutil.make_archive('tmp/results', 'zip', results_dir)
    return FileResponse(path='tmp/results.zip', filename='results.zip', media_type='application/zip')


@app.get("/datasets/{identifier}/scores", tags=["results"])
def get_results_compiled(identifier: str):
    auc = get_output_auc(identifier)['auc_score']
    jsd = get_output_jsd(identifier)['jsd_score']
    norm = get_output_norm(identifier)['norm']
    return {"auc": auc, "jsd": jsd, "norm": norm}


@app.get("/datasets/{identifier}/plots/violin", tags=["results"])
def get_available_violin_plots(identifier: str):
    columns = []
    root, violin_dir = resolve_dataset_path(identifier, "plots", "violin")
    if not violin_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    for filename in os.listdir(violin_dir):
        if filename.endswith(".png"):
            # remove file ending and append to list
            basename, extension = os.path.splitext(filename)
            columns.append(basename)
    return {"available_columns": columns}


@app.get("/datasets/{identifier}/plots/violin/{name}", tags=["results"])
def get_violin_plot(identifier: str, name: str):
    if name not in get_available_violin_plots(identifier)["available_columns"]:
        raise HTTPException(status_code=404, detail="No plot found in {} for name {}.".format(identifier, name))
    root, plot_path = resolve_dataset_path(identifier, "plots", "violin", safe_component(name) + ".png")
    if not plot_path.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    return FileResponse(plot_path)
        


@app.get("/datasets/{identifier}/plots/correlation", tags=["results"])
def get_correlation_plot(identifier: str, type: str):
    root, correlation_dir = resolve_dataset_path(identifier, "plots", "correlation")
    if not correlation_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    if type == "real":
        plot_path = os.path.join(correlation_dir, 'dec_rp.png')
        if not plot_path.startswith(root + os.sep):
            raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
        resp = FileResponse(plot_path)
    elif type == "virtual":
        plot_path = os.path.join(correlation_dir, 'dec_vp.png')
        if not plot_path.startswith(root + os.sep):
            raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
        resp = FileResponse(plot_path)
    else:
        raise HTTPException(status_code=400, detail="Plot type argument must be either real or virtual.")
    # disable caching
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp


@app.get("/datasets/{identifier}/plots", tags=["export"])
def export_plots(identifier: str):
    root, plots_dir = resolve_dataset_path(identifier, "plots")
    if not plots_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    output_zip = shutil.make_archive('tmp/plots', 'zip', plots_dir)
    return FileResponse(path='tmp/plots.zip', filename='plots.zip', media_type='application/zip')


@app.patch("/datasets/default/results/auc", status_code=201, tags=["processing"])
async def process_auc():
    processing.process_auc("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/jsd", status_code=201, tags=["processing"])
async def process_jsd():
    processing.process_jsd("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/norm", status_code=201, tags=["processing"])
async def process_norm():
    processing.process_norm("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/risk_linkability", status_code=201, tags=["processing"])
async def process_linkability_risk():
    processing.process_linkability_risk("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/risk_inference", status_code=201, tags=["processing"])
async def process_inference_risk():
    processing.process_inference_risk("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/risk_singling_out", status_code=201, tags=["processing"])
async def process_singling_out_risk():
    processing.process_singling_out_risk("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/column_types", status_code=201, tags=["processing"])
async def process_column_types():
    processing.get_column_types("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/tsne", status_code=201, tags=["processing"])
async def process_tsne():
    processing.process_tsne("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/results/outliers", status_code=201, tags=["processing"])
async def process_outliers():
    processing.get_outlier_scores("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/plots/violin", status_code=201, tags=["processing"])
async def process_violin_plots():
    for f in [f for f in os.listdir("datasets/default/plots/violin")]:
        os.remove(os.path.join("datasets/default/plots/violin", f))
    processing.create_violin_plots("default")
    return {"message:": "Successfully finished processing."}


@app.patch("/datasets/default/plots/correlation", status_code=201, tags=["processing"])
async def process_correlation_plots():
    processing.create_correlation_plots("default")
    return {"message:": "Successfully finished processing."}


@app.post("/datasets/default/patients/real", tags=["processing"])
def upload_real_patients(file: UploadFile = File(...)):
    filename, file_extension = os.path.splitext(file.filename)
    if file_extension != '.csv':
        raise HTTPException(status_code=403, detail="Only csv files supported.")
    file_path = "datasets/default/patients/real.csv"
    try:
        with open(file_path, 'wb+') as f:
            while contents := file.file.read():
                f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during processing of the uploaded file.")
    finally:
        file.file.close()
    return {"message": f"Successfully uploaded {file.filename}"}


@app.post("/datasets/default/patients/synthetic", tags=["processing"])
def upload_synthetic_patients(file: UploadFile = File(...)):
    filename, file_extension = os.path.splitext(file.filename)
    if file_extension != '.csv':
        raise HTTPException(status_code=403, detail="Only csv files are supported.")
    file_path = "datasets/default/patients/synthetic.csv"
    try:
        with open(file_path, 'wb+') as f:
            while contents := file.file.read():
                f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during processing of the uploaded file.")
    finally:
        file.file.close()
    return {"message": f"Successfully uploaded {file.filename}"}


@app.put("/datasets/{identifier}", status_code=201, tags=["processing"])
def create_new_dataset_based_on_current_results(identifier: str):
    existing_datasets = get_available_data_sets()
    if identifier in existing_datasets:
        raise HTTPException(status_code=423, detail="A resource with the requested identifier already exists.")
    else:
        root, new_dir_name = resolve_dataset_path(identifier)
        if new_dir_name == root or not new_dir_name.startswith(root + os.sep):
            raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
        # clear real data before copying
        os.remove("datasets/default/patients/real.csv")
        os.mkdir(new_dir_name)
        shutil.copytree("datasets/default", new_dir_name, dirs_exist_ok=True)
        return {"message": f"Successfully created dataset {identifier}"}


@app.post("/datasets/{identifier}/patients/synthetic/search", tags=["search"])
async def filter_synthetic_patients(identifier: str, data: ColumnConstraintList):
    root, patients_dir = resolve_dataset_path(identifier, "patients")
    if not patients_dir.startswith(root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid dataset identifier.")
    virtual = load_virtual_patients_decoded(patients_dir)
    result = get_similar_patients(virtual, data.constraints)
    return Response(result.head(10).to_json(orient="records"), media_type="application/json")


@app.get("/datasets/default/results/last-update", tags=["info"])
def get_latest_cache_change_date():
    filename = "datasets/default/results/auc.npy"
    filestat = os.stat(filename)
    return filestat.st_mtime


@app.get("/datasets/default/patients/real/last-update", tags=["info"])
def get_latest_cache_real_patients():
    filename = "datasets/default/patients/real.csv"
    filestat = os.stat(filename)
    return filestat.st_mtime


@app.get("/datasets/default/patients/synthetic/last-update", tags=["info"])
def get_latest_cache_change_synthetic_patients():
    filename = "datasets/default/patients/synthetic.csv"
    filestat = os.stat(filename)
    return filestat.st_mtime

@app.post("/datasets/import", tags=["import"])
def upload_datasets_resources(file: UploadFile = File(...), credentials: HTTPBasicCredentials = Depends(authenticate_user)):
    # check if the file is a zip archive
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .zip files are accepted.")
    # save the uploaded file
    archive_path = os.path.join("/tmp", os.path.basename(file.filename))
    with open(archive_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    # validate archive structure
    errors = validate_datasets_archive_structure(archive_path)
    if errors:
        os.remove(archive_path)
        return JSONResponse(content={"errors": errors}, status_code=400)
    # extract files to /datasets folder
    extract_zip_safely(archive_path, "datasets")
    # clear tmp
    os.remove(archive_path)
    return JSONResponse(content={"message": "Files extracted successfully"})


@app.post("/datasets/export", tags=["export"])
def download_datasets_resources(credentials: HTTPBasicCredentials = Depends(authenticate_user)):
    archive_content = create_datasets_archive()
    return StreamingResponse(io.BytesIO(archive_content), media_type="application/zip", headers={
        "Content-Disposition": "attachment; filename=datasets_archive.zip"
    })

@app.patch("/datasets/default/patients/synthetic/postprocessing", status_code=201, tags=["processing"])
def apply_post_processing_to_synthetic_data(normalize_scale: bool = False,
                                            assert_minmax: bool = False,
                                            normalize_float_precision: bool = False):
    synthetic_data = pd.read_csv("datasets/default/patients/synthetic.csv")
    real_data = pd.read_csv("datasets/default/patients/real.csv")
    if normalize_scale:
        synthetic_data = syndat.postprocessing.normalize_scale(real_data, synthetic_data)
    if assert_minmax:
        synthetic_data = syndat.postprocessing.assert_minmax(real_data, synthetic_data)
    if normalize_float_precision:
        synthetic_data = syndat.postprocessing.normalize_float_precision(real_data, synthetic_data)
    synthetic_data.to_csv("datasets/default/patients/synthetic.csv", index=False)
    return {"message": "Post-processing applied to synthetic data."}