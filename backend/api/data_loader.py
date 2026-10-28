import glob
import os
import shutil
import tempfile
import zipfile
from fastapi import HTTPException
import pandas as pd
from pandas.core.dtypes.common import is_numeric_dtype
from typing import List

from api import sanity


def load_virtual_patients_decoded(output_path):
    df_virtual = pd.read_csv(output_path + "/synthetic.csv", dtype={"SUBJID": str})
    return df_virtual


def load_real_patients_decoded(output_path):
    data_path = "../vambn/01_data/data_python/"
    header_path = "../vambn/01_data/python_names/"
    # get all csv files from datasets dir
    files = glob.glob(data_path + "/*.csv")
    # replace path to only filename
    filenames = [os.path.split(file)[1].replace(".csv", "") for file in files]
    # remove all missing and type files
    col_names = [filename for filename in filenames if "missing" not in filename]
    col_names = [filename for filename in col_names if "types" not in filename]
    columns = []
    for col_name in col_names:
        # get column names, first row just says "x" so remove it
        names = pd.read_csv(header_path + col_name + "_cols.csv")
        # get actual datasets and set correct col names based on name file
        df = pd.read_csv(data_path + col_name + ".csv", names=names["x"])
        columns.append(df)
    frame = pd.concat(columns, axis=0, ignore_index=True)
    return frame


def load_data_decoded(output_path, row_limit=sanity.MAX_PROCESSING_ROWS):
    """Load, validate and align the real and synthetic patient data.

    Validation happens here so that every processing step is guarded, including
    data that arrived through a dataset import or was already on disk. Pass
    ``row_limit=None`` to keep all rows.
    """
    return sanity.load_prepared_pair(output_path, row_limit=row_limit)


def load_data_encoded(directory_name):
    df_real = load_real_patients_encoded(directory_name)
    df_virtual = load_virtual_patients_encoded(directory_name)
    df_real = encode_numerical_columns(df_real)
    df_virtual = encode_numerical_columns(df_virtual)
    return df_real, df_virtual


def load_real_patients_encoded(directory_name):
    real = directory_name + "/main_RealPPts.csv"
    df_real = pd.read_csv(real)
    return df_real


def load_virtual_patients_encoded(directory_name):
    virtual = directory_name + "/main_VirtualPPts.csv"
    df_virtual = pd.read_csv(virtual)
    return df_virtual


def encode_numerical_columns(patient_data):
    # check all columns for non-numeric (categorical) datasets and encode
    tmp = patient_data.copy()
    for column in tmp:
        if not is_numeric_dtype(tmp[column]):
            tmp[column] = tmp[column].astype('category')
            tmp[column] = tmp[column].cat.codes
    return tmp


def decode_numerical_columns(df):
    return None


def normalize(patient_data):
    normalized_data = (patient_data - patient_data.min()) / (patient_data.max() - patient_data.min())
    return normalized_data


def _is_within_directory(directory: str, target: str) -> bool:
    directory = os.path.realpath(directory)
    target = os.path.realpath(target)
    return target == directory or target.startswith(directory + os.sep)


def extract_zip_safely(archive_path: str, destination: str) -> None:
    """Extract a zip archive, rejecting members that escape the destination.

    Guards against "zip slip": absolute member paths or names containing ".."
    that would write outside the target directory.
    """
    with zipfile.ZipFile(archive_path, 'r') as zip_ref:
        for member in zip_ref.namelist():
            member_path = os.path.join(destination, member)
            if not _is_within_directory(destination, member_path):
                raise HTTPException(status_code=400, detail=f"Unsafe path in archive: {member}")
        zip_ref.extractall(destination)


def validate_datasets_archive_structure(archive_path: str) -> List[str]:
    errors = []
    expected_folders = ['patients', 'plots', 'results']
    expected_files = {
        'patients': ['synthetic.csv'],
        'plots/correlation': ['dec_rp.png', 'dec_vp.png'],
        'results': [
            'auc.npy', 'norm.npy', 'risk_inference.npy', 'x_real.npy', 'y_virtual.npy',
            'column_types.npy', 'norm_real.npy', 'risk_linkability.npy', 'x_virtual.npy',
            'jsd.npy', 'norm_virtual.npy', 'risk_singling_out.npy', 'y_real.npy'
        ]
    }
    with tempfile.TemporaryDirectory() as temp_dir:
        extract_zip_safely(archive_path, temp_dir)
        for item in os.listdir(temp_dir):
            folder_path = os.path.join(temp_dir, item)
            if os.path.isdir(folder_path):
                for root, dirs, files in os.walk(folder_path):
                    root = root[len(folder_path) + 1:]
                    for expected_folder in expected_folders:
                        if expected_folder not in dirs:
                            errors.append(f"missing folder: {os.path.join(item, root, expected_folder)}")
                        else:
                            dirs.remove(expected_folder)
                    for folder, files in expected_files.items():
                        for file in files:
                            if file not in os.listdir(os.path.join(folder_path, root, folder)):
                                errors.append(f"missing file: {os.path.join(item, root, folder, file)}")
    return errors


def create_datasets_archive():
    dataset_folder = "datasets"
    exclude_folder = "default"
    archive_name = "datasets_archive"
    temp_dir = "temp_datasets"
    os.makedirs(temp_dir, exist_ok=True)
    try:
        folders_to_include = [folder for folder in os.listdir(dataset_folder) if folder != exclude_folder]
        if not folders_to_include:
            raise HTTPException(status_code=400, detail="No folders to include in the archive.")
        for folder in folders_to_include:
            shutil.copytree(os.path.join(dataset_folder, folder), os.path.join(temp_dir, folder))
        shutil.make_archive(archive_name, "zip", temp_dir)
        archive_path = f"{archive_name}.zip"
        with open(archive_path, "rb") as archive_file:
            archive_content = archive_file.read()
        shutil.rmtree(temp_dir, ignore_errors=True)
        os.remove(archive_path)
        return archive_content
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        os.remove(archive_name, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))
