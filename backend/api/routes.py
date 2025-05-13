import io
import os
import shutil
from distutils.dir_util import copy_tree
import zipfile
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
from api.data_loader import create_datasets_archive, load_data_decoded, load_virtual_patients_decoded, validate_datasets_archive_structure
from api.filtering import get_column_types, get_similar_patients
from api.auth import authenticate_user, init_credentials


app = FastAPI(
    title="SYNDAT API",
    description="API interface to access programmatic functionalities of SYNDAT.",
    version="0.8.0",
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


@app.get("/datasets/{identifier}/patients/synthetic/{index}", tags=["results"])
def get_synthetic_patient(index: int, identifier: str):
    return load_virtual_patients_decoded("datasets/patients/" + identifier).loc[index]


@app.get("/datasets/{identifier}/patients/synthetic", response_model=List[ColumnTypeResponse], tags=["results"])
def get_output_column_types(identifier: str):
    # drop ID column
    virtual = load_virtual_patients_decoded("datasets/" + identifier + "/patients").drop(columns='SUBJID', axis=1, errors='ignore')
    column_types = get_column_types(virtual)
    return column_types


@app.get("/datasets/{identifier}/results/auc", tags=["results"])
def get_output_auc(identifier: str):
    # load from results if possible
    if os.path.isfile('datasets/{}/results/auc.npy'.format(identifier)):
        auc_score = np.load('datasets/{}/results/auc.npy'.format(identifier)).item()
        return {"auc_score": auc_score}
    else:
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/jsd", tags=["results"])
def get_output_jsd(identifier: str):
    if os.path.isfile('datasets/{}/results/jsd.npy'.format(identifier)):
        jsd_score = np.load('datasets/{}/results/jsd.npy'.format(identifier)).item()
        return {"jsd_score": jsd_score}
    else:
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/norm", tags=["results"])
def get_output_norm(identifier: str):
    if os.path.isfile('datasets/{}/results/norm.npy'.format(identifier)):
        norm = np.load('datasets/{}/results/norm.npy'.format(identifier)).item()
        return {"norm": norm}
    else:
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/privacy", tags=["results"])
def get_privacy_score(identifier: str):
    # load from results if possible
    if os.path.isfile('datasets/{}/results/privacy_score.npy'.format(identifier)):
        privacy_score = np.load('datasets/{}/results/privacy_score.npy'.format(identifier)).item()
        return {"privacy_score": privacy_score}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/outliers", tags=["results"])
def get_output_outliers(identifier: str, anomaly_score: bool):
    if os.path.isfile('datasets/{}/results/anomaly_scores.npy'.format(identifier)):
        outliers = np.load('datasets/{}/results/anomaly_scores.npy'.format(identifier))
        if anomaly_score:
            return {"Outlier_Scores": outliers.tolist()}
        else:
            return {"outlier_indices": outliers.tolist()}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/tsne", tags=["results"])
def get_tsne_plotly_data(identifier: str):
    if os.path.isfile('datasets/{}/results/x_real.npy'.format(identifier)) \
            and os.path.isfile('datasets/{}/results/x_virtual.npy'.format(identifier)) \
            and os.path.isfile('datasets/{}/results/y_real.npy'.format(identifier)) \
            and os.path.isfile('datasets/{}/results/y_virtual.npy'.format(identifier)):
        x_real = np.load('datasets/{}/results/x_real.npy'.format(identifier))
        x_virtual = np.load('datasets/{}/results/x_virtual.npy'.format(identifier))
        y_real = np.load('datasets/{}/results/y_real.npy'.format(identifier))
        y_virtual = np.load('datasets/{}/results/y_virtual.npy'.format(identifier))
        trace_real = {"x": x_real.tolist(), "y": y_real.tolist()}
        trace_virtual = {"x": x_virtual.tolist(), "y": y_virtual.tolist()}
        return {"trace_real": trace_real, "trace_virtual": trace_virtual}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/risk_singling_out", tags=["results"])
def get_risk_singling_out(identifier: str):
    if os.path.isfile('datasets/{}/results/risk_singling_out.npy'.format(identifier)):
        risk_singling_out = np.load('datasets/{}/results/risk_singling_out.npy'.format(identifier)).item()
        return {"risk": risk_singling_out}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/risk_linkability", tags=["results"])
def get_risk_linkability(identifier: str):
    if os.path.isfile('datasets/{}/results/risk_linkability.npy'.format(identifier)):
        risk_linkability = np.load('datasets/{}/results/risk_linkability.npy'.format(identifier)).item()
        return {"risk": risk_linkability}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/risk_inference", tags=["results"])
def get_risk_inference(identifier: str):
    if os.path.isfile('datasets/{}/results/risk_inference.npy'.format(identifier)):
        risk_inference = np.load('datasets/{}/results/risk_inference.npy'.format(identifier)).item()
        return {"risk": risk_inference}
    else:
        raise HTTPException(status_code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results", tags=["export"])
def export_results_set(identifier: str):
    output_zip = shutil.make_archive('tmp/results', 'zip', 'datasets/' + identifier + '/results')
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
    for filename in os.listdir("datasets/{}/plots/violin".format(identifier)):
        if filename.endswith(".png"):
            # remove file ending and append to list
            basename, extension = os.path.splitext(filename)
            columns.append(basename)
    return {"available_columns": columns}


@app.get("/datasets/{identifier}/plots/violin/{name}", tags=["results"])
def get_violin_plot(identifier: str, name: str):
    if name not in get_available_violin_plots(identifier)["available_columns"]:
        raise HTTPException(status_code=404, detail="No plot found in {} for name {}.".format(identifier, name))
    return FileResponse('datasets/{}/plots/violin/{}.png'.format(identifier, name))
        


@app.get("/datasets/{identifier}/plots/correlation", tags=["results"])
def get_correlation_plot(identifier: str, type: str):
    if type == "real":
        return FileResponse('datasets/{}/plots/correlation/dec_rp.png'.format(identifier))
    elif type == "virtual":
        return FileResponse('datasets/{}/plots/correlation/dec_vp.png'.format(identifier))
    else:
        raise HTTPException(status_code=400, detail="Plot type argument must be either real or virtual.")


@app.get("/datasets/{identifier}/plots", tags=["export"])
def export_plots(identifier: str):
    output_zip = shutil.make_archive('tmp/plots', 'zip', 'datasets/' + identifier + '/plots')
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
        new_dir_name = "datasets/" + identifier
        # clear real data before copying
        os.remove("datasets/default/patients/real.csv")
        os.mkdir(new_dir_name)
        copy_tree("datasets/default", new_dir_name)
        return {"message": f"Successfully created dataset {identifier}"}


@app.post("/datasets/{identifier}/patients/synthetic/search", tags=["search"])
async def filter_synthetic_patients(identifier: str, data: ColumnConstraintList):
    real, virtual = load_data_decoded(output_path="datasets/" + identifier + "/patients")
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
    archive_path = f"/tmp/{file.filename}"
    with open(archive_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    # validate archive structure
    errors = validate_datasets_archive_structure(archive_path)
    if errors:
        os.remove(archive_path)
        return JSONResponse(content={"errors": errors}, status_code=400)
    # extract files to /datasets folder
    with zipfile.ZipFile(archive_path, 'r') as zip_ref:
        zip_ref.extractall("datasets")
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