import glob
import os

import pandas as pd
from pandas.core.dtypes.common import is_numeric_dtype


def load_virtual_patients_decoded(output_path):
    df_virtual = pd.read_csv(output_path + "/decodedVP.csv")
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


def load_data_decoded(output_path):
    # real = load_real_patients_decoded().dropna()
    real = pd.read_csv(output_path + '/reconRP.csv')
    virtual = pd.read_csv(output_path + "/decodedVP.csv")
    # sort columns so both dataframes align
    real = real.reindex(sorted(real.columns), axis=1).drop("SUBJID", 1,  errors='ignore')
    virtual = virtual.reindex(sorted(real.columns), axis=1)
    return real, virtual


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


