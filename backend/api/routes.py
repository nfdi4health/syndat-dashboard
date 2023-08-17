import os
import shutil
import threading
from distutils.dir_util import copy_tree

import numpy as np
import logging

from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, RedirectResponse, Response

from api import processing
from api.data_loader import load_data_decoded, load_virtual_patients_decoded
from api.filtering import get_column_types, get_similar_patients

app = FastAPI(
    title="VAMBN API",
    description="API interface to access the basic features of the VAMBN software.",
    version="0.2.0",
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


@app.get("/", include_in_schema=False)
def swagger_redirect():
    return RedirectResponse(url='/docs')


@app.get("/version")
def get_current_version():
    return "0.3.0"


@app.get("/error", status_code=200)
def get_error_log(response: Response):
    if os.path.isfile('error.txt'):
        with open('error.txt') as f:
            error = f.read()
        return {"content": error}
    else:
        response.status_code = 204
        return {"content": "No error occurred."}


@app.get("/status")
def get_status():
    raise HTTPException(status_code=501, detail="Not Implemented.")


@app.get("/datasets")
def get_available_data_sets():
    datasets = [f for f in os.listdir("datasets") if os.path.isdir(os.path.join("datasets", f))]
    datasets_sorted = np.sort(datasets)
    datasets_sorted_without_default = np.delete(datasets_sorted, np.argwhere(datasets_sorted == "default"))
    return datasets_sorted_without_default.tolist()


@app.get("/datasets/{identifier}/virtual/{index}")
def get_virtual_patients_decoded(index: int, identifier: str):
    return load_virtual_patients_decoded("datasets/" + identifier).loc[index]


@app.get("/datasets/{identifier}/virtual/", response_model=List[ColumnTypeResponse])
def get_output_column_types(identifier: str):
    # drop ID column
    virtual = load_virtual_patients_decoded("datasets/" + identifier).drop('SUBJID', 1, errors='ignore')
    column_types = get_column_types(virtual)
    return column_types


@app.get("/datasets/{identifier}/results/auc")
def get_output_auc(identifier: str):
    # load from results if possible
    if os.path.isfile('datasets/{}/results/auc.npy'.format(identifier)):
        auc_score = np.load('datasets/{}/results/auc.npy'.format(identifier)).item()
        return {"auc_score": auc_score}
    else:
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/jsd")
def get_output_jsd(identifier: str):
    if os.path.isfile('datasets/{}/results/jsd.npy'.format(identifier)):
        jsd_score = np.load('datasets/{}/results/jsd.npy'.format(identifier)).item()
        return {"jsd_score": jsd_score}
    else:
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/norm")
def get_output_norm(identifier: str):
    if os.path.isfile('datasets/{}/results/norm_real.npy'.format(identifier)) \
            and os.path.isfile('datasets/{}/results/norm_virtual.npy'.format(identifier)):
        norm_real = np.load('datasets/{}/results/norm_real.npy'.format(identifier)).item()
        norm_virtual = np.load('datasets/{}/results/norm_virtual.npy'.format(identifier)).item()
        return {"norm_real": norm_real, "norm_virtual": norm_virtual}
    else:
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/outliers")
def get_output_outliers(identifier: str, anomaly_score: bool):
    if os.path.isfile('datasets/{}/results/anomaly_scores.npy'.format(identifier)):
        outliers = np.load('datasets/{}/results/anomaly_scores.npy'.format(identifier))
        if anomaly_score:
            return {"Outlier_Scores": outliers.tolist()}
        else:
            return {"outlier_indices": outliers.tolist()}
    else:
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/results/tsne")
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
        raise HTTPException(code=404, detail="No saved results found for dataset ID {}".format(identifier))


@app.get("/datasets/{identifier}/plots/violin")
def get_available_violin_plots(identifier: str):
    columns = []
    print(identifier)
    for filename in os.listdir("datasets/{}/plots/violin".format(identifier)):
        if filename.endswith(".png"):
            # remove file ending and append to list
            columns.append(filename.split(".")[0])
    return {"available_columns": columns}


@app.get("/datasets/{identifier}/plots/violin/{name}")
def get_entropy_plot(identifier: str, name: str):
    return FileResponse('datasets/{}/plots/violin/{}.png'.format(identifier, name))


@app.get("/datasets/{identifier}/plots/correlation")
def get_correlation_plot(identifier: str, type: str):
    if type == "real":
        return FileResponse('datasets/{}/plots/correlation/dec_rp.png'.format(identifier))
    elif type == "virtual":
        return FileResponse('datasets/{}/plots/correlation/dec_vp.png'.format(identifier))
    else:
        raise HTTPException(status_code=400, detail="Plot type argument must be either real or virtual.")


@app.patch("/datasets/default/results", status_code=201)
def process_output():
    # cleanup existing files
    if not os.path.isfile('datasets/default/decodedVP.csv') \
            or not os.path.isfile('datasets/default/reconRP.csv'):
        raise HTTPException(status_code=404, detail='There has not been any output datasets set or generated.')
    # clear results
    for f in [f for f in os.listdir("datasets/default/results")]:
        os.remove(os.path.join("datasets/default/results", f))
    # clear plots
    for f in [f for f in os.listdir("datasets/default/plots/correlation")]:
        os.remove(os.path.join("datasets/default/plots/correlation", f))
    for f in [f for f in os.listdir("datasets/default/plots/violin")]:
        os.remove(os.path.join("datasets/default/plots/violin", f))
    # storage constants
    input_dir = "datasets/default"
    output_dir = input_dir + "/results"
    plot_dir = input_dir + "/plots"
    # process async
    thread = threading.Thread(processing.process_rp_vp_results(input_dir, output_dir, plot_dir))
    thread.start()
    return {"message:": "Successfully triggered input processing."}

@app.post("/datasets/default")
def upload_any(file: UploadFile = File(...)):
    name = file.filename
    if name == "reconRP.csv":
        file_path = "datasets/default/reconRP.csv"
    elif name == "decodedVP.csv":
        file_path = "datasets/default/decodedVP.csv"
    else:
        raise HTTPException(status_code=403, detail="The specified filename could not be uploaded.")
    try:
        with open(file_path, 'wb+') as f:
            while contents := file.file.read():
                f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during processing of the uploaded file.")
    finally:
        file.file.close()
    return {"message": f"Successfully uploaded {file.filename}"}


@app.put("/datasets/{identifier}", status_code=201)
def create_new_dataset_based_on_current_results(identifier: str):
    existing_datasets = get_available_data_sets()
    if identifier in existing_datasets:
        raise HTTPException(status_code=423, detail="A resource with the requested identifier already exists.")
    else:
        new_dir_name = "datasets/" + identifier
        os.mkdir(new_dir_name)
        copy_tree("datasets/default", new_dir_name)
        return {"message": f"Successfully created dataset {identifier}"}


@app.post("/datasets/{identifier}/virtual")
def filter_virtual_patients(identifier: str, data: ColumnConstraintList):
    real, virtual = load_data_decoded(output_path="datasets/" + identifier)
    result = get_similar_patients(virtual, data.constraints)
    return Response(result.head(10).to_json(orient="records"), media_type="application/json")


@app.get("/datasets/default/results/date")
def get_latest_cache_change_date():
    filename = "datasets/default/results/auc.npy"
    statbuf = os.stat(filename)
    return statbuf.st_mtime


@app.get("/datasets/default/date")
def get_latest_cache_change_date():
    filename = "datasets/default/decodedVP.csv"
    statbuf = os.stat(filename)
    return statbuf.st_mtime


@app.put("vambn/output/patients/real")
def upload_real_patient_data(file: UploadFile = File(...)):
    try:
        with open("vambn/04_output/HI-VAE/reconRP.csv", 'wb+') as f:
            while contents := file.file.read():
                f.write(contents)
    except Exception as e:
        print(e)
        return {"message": "There was an error uploading the file"}
    finally:
        file.file.close()
    return {"message": f"Successfully uploaded {file.filename}"}


@app.put("vambn/output/patients/virtual")
def upload_virtual_patient_data(file: UploadFile = File(...)):
    try:
        with open("vambn/04_output/HI-VAE/decodedVP.csv", 'wb+') as f:
            while contents := file.file.read():
                f.write(contents)
    except Exception as e:
        print(e)
        return {"message": "There was an error uploading the file"}
    finally:
        file.file.close()
    return {"message": f"Successfully uploaded {file.filename}"}


@app.get("/vambn/output")
def get_output():
    if get_status()["status"] != 3:
        raise HTTPException(status_code=404, detail='There has not been any output generated (yet).')
    if os.path.isdir('tmp'):
        # clear tmp dir
        shutil.rmtree('tmp')
        os.mkdir('tmp')
    output_zip = shutil.make_archive('tmp/output', 'zip', 'vambn/04_output')
    return FileResponse(path='tmp/output.zip', filename='output.zip', media_type='application/zip')


@app.get("/vambn/output/error")
def get_error_report():
    if get_status().get('status') != 4:
        raise HTTPException(status_code=404, detail='There is no error report available.')
    return FileResponse('vambn/04_output/error.txt')
