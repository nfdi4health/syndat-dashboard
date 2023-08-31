import random as rnd
import numpy as np

from api import classification, visualization, data_loader, filtering, plotting, privacy
from api.data_loader import encode_numerical_columns
from api.domain import NaNHandlingStrategy


def process_auc(dataset_name):
    real_enc, virtual_enc = load_and_decode(dataset_name)
    auc = classification.get_auc(real_enc, virtual_enc)
    np.save("datasets/" + dataset_name + "/results/auc.npy", auc)


def process_jsd(dataset_name):
    real_enc, virtual_enc = load_and_decode(dataset_name)
    jsd = classification.get_jsd(real_enc, virtual_enc)
    np.save("datasets/" + dataset_name + "/results/jsd.npy", jsd)


def process_norm(dataset_name):
    real_enc, virtual_enc = load_and_decode(dataset_name)
    norm = classification.get_norm_score(real_enc, virtual_enc)
    np.save("datasets/" + dataset_name + "/results/norm.npy", norm)


def process_singling_out_risk(dataset_name):
    real_enc, virtual_enc = load_and_decode(dataset_name)
    risk = privacy.get_singling_out_risk(real_enc, virtual_enc)
    np.save("datasets/" + dataset_name + "/results/risk_singling_out.npy", risk)


def process_linkability_risk(dataset_name):
    real_enc, virtual_enc = load_and_decode(dataset_name)
    risk = privacy.get_linkability_risk(real_enc, virtual_enc)
    np.save("datasets/" + dataset_name + "/results/risk_linkability.npy", risk)


def process_inference_risk(dataset_name):
    real_enc, virtual_enc = load_and_decode(dataset_name)
    risk = privacy.get_inference_risk(real_enc, virtual_enc)
    np.save("datasets/" + dataset_name + "/results/risk_inference.npy", risk)


def get_column_types(dataset_name):
    data_root_dir = "datasets/" + dataset_name + "/patients"
    real, virtual = data_loader.load_data_decoded(data_root_dir)
    column_types = filtering.get_column_types(real)
    np.save("datasets/" + dataset_name + "/results/column_types.npy", column_types)


def process_tsne(dataset_name):
    real_enc, virtual_enc = load_and_decode(dataset_name)
    if real_enc.shape[0] > 1000:
        real_subsampled = real_enc.sample(1000)
        virtual_subsampled = virtual_enc.sample(1000)
        x_real, y_real, x_virtual, y_virtual = visualization.get_tsne_plot_data(real_subsampled, virtual_subsampled)
    else:
        x_real, y_real, x_virtual, y_virtual = visualization.get_tsne_plot_data(real_enc, virtual_enc)
    np.save("datasets/" + dataset_name + "/results/x_real.npy", x_real)
    np.save("datasets/" + dataset_name + "/results/y_real.npy", y_real)
    np.save("datasets/" + dataset_name + "/results/x_virtual.npy", x_virtual)
    np.save("datasets/" + dataset_name + "/results/y_virtual.npy", y_virtual)


def get_outlier_scores(dataset_name):
    data_root_dir = "datasets/" + dataset_name + "/patients"
    real, virtual = data_loader.load_data_decoded(data_root_dir)
    real_no_nan, virtual_no_nan = handle_nan_values(real, virtual)
    outlier_scores = classification.get_outliers(virtual_no_nan, anomaly_score=True)
    np.save("datasets/" + dataset_name + "/plots/anomaly_scores.npy", outlier_scores)


def create_violin_plots(dataset_name):
    data_root_dir = "datasets/" + dataset_name + "/patients"
    real, virtual = data_loader.load_data_decoded(data_root_dir)
    plotting.create_violin_plots(real, virtual, "datasets/" + dataset_name + "/plots/violin")


def create_correlation_plots(dataset_name):
    data_root_dir = "datasets/" + dataset_name + "/patients"
    real, virtual = data_loader.load_data_decoded(data_root_dir)
    plotting.create_correlation_plots(real, virtual, "datasets/" + dataset_name + "/plots/correlation")


def load_and_decode(dataset_name):
    data_root_dir = "datasets/" + dataset_name + "/patients"
    real, virtual = data_loader.load_data_decoded(data_root_dir)
    real_no_nan, virtual_no_nan = handle_nan_values(real, virtual)
    real_enc = encode_numerical_columns(real_no_nan)
    virtual_enc = encode_numerical_columns(virtual_no_nan)
    return real_enc, virtual_enc


def handle_nan_values(real, virtual, strategy=NaNHandlingStrategy.sample_random):
    if not (real.isnull().values.any() or virtual.isnull().values.any()):
        return real, virtual
    if strategy == NaNHandlingStrategy.accept_inbalance:
        return real.dropna(), virtual.dropna()
    if strategy == NaNHandlingStrategy.sample_random:
        # remove all rows containing NaN values
        real = real.dropna()
        virtual = virtual.dropna()
        # subsample in such a way that each dataframe has the same amount of rows
        if real.shape[0] < virtual.shape[0]:
            virtual = virtual.loc[np.random.choice(virtual.index, real.shape[0], replace=False)]
        elif virtual.shape[0] < real.shape[0]:
            real = real.loc[np.random.choice(real.index, virtual.shape[0], replace=False)]
    elif strategy == NaNHandlingStrategy.sample_closest:
        # remove all rows containing NaN values
        real = real.dropna()
        virtual = virtual.dropna()
        # order columns such that identical align in order
        real = real.reindex(sorted(real.columns), axis=1)
        virtual = virtual.reindex(sorted(virtual.columns), axis=1)
        # sample in the bigger set (either real or virtual) the data points that are most similar
        sample_idx = []
        if real.shape[0] < virtual.shape[0]:
            for a in real.to_numpy():
                distance = get_vector_to_mixed_matrix_distance(a, virtual.to_numpy())
                sample_idx.append(np.argmin(distance))
            virtual = virtual.iloc[sample_idx]
        elif virtual.shape[0] < real.shape[0]:
            for a in virtual.to_numpy():
                distance = get_vector_to_mixed_matrix_distance(a, real.to_numpy())
                sample_idx.append(np.argmin(distance))
            real = real.iloc[sample_idx]
    elif strategy == NaNHandlingStrategy.encode_nan:
        for col in real:
            sum_real_na = real[col].isna().sum()
            sum_virtual_na = virtual[col].isna().sum()
            sum_diff = abs(sum_virtual_na - sum_real_na)
            if sum_real_na > sum_virtual_na:
                # sample indices to replace with NaN
                replace_idx = rnd.sample(range(1, virtual.shape[0]), sum_diff)
                virtual.loc[replace_idx, col] = None
            elif sum_real_na < sum_virtual_na:
                # sample indices to replace with NaN
                replace_idx = rnd.sample(range(1, real.shape[0]), sum_diff)
                real.loc[replace_idx, col] = None
            # encode NaN
            cat_col_bool = [column_is_categorical(col) for col in real.dropna().to_numpy().T]
            cat_cols = np.array(real.columns)[cat_col_bool]
            num_cols = np.array(real.columns)[np.invert(cat_col_bool)]
            for col in cat_cols:
                real[col] = real[col].fillna(real[col].max() + 1)
                virtual[col] = virtual[col].fillna(virtual[col].max() + 1)
            for col in num_cols:
                real[col] = real[col].fillna(0)
                virtual[col] = virtual[col].fillna(0)
    return real, virtual


# FIXME
def get_distance_matrix(df1, df2):
    assert df1.columns.equals(df2.columns)
    # return for each row in df1 the index of the closest candidate in df2
    m1 = df1.to_numpy()
    m2 = df2.to_numpy()
    return np.array([get_vector_to_mixed_matrix_distance(vec, m2) for vec in m2])


def get_vector_to_mixed_matrix_distance(vec, matrix):
    # get mask for categorical columns
    cat_cols = [column_is_categorical(col) for col in matrix.T]
    num_cols = np.invert(cat_cols)
    # number of different categorical columns for each row of df
    cat_distances = np.sum(matrix[:, cat_cols] == vec[cat_cols], axis=1)
    num_distances = np.array([get_normalized_vector_distance(vec, row) for row in matrix])
    return cat_distances + num_distances


def get_normalized_vector_distance(vec1, vec2):
    diff = np.abs(vec1 - vec2)
    max = np.maximum.reduce([vec1, vec2])
    min = np.minimum.reduce([vec1, vec2])
    range = np.abs(max) + np.abs(min)
    quotient = np.divide(diff, range)
    quotient[np.isnan(quotient)] = 0
    sum = np.sum(quotient)
    return sum


def column_is_categorical(col):
    if col.dtype == "object":
        return True
    # ugly heuristic for encoded categorical values
    elif np.sum(np.asarray(col)) % 1 == 0 and np.max(np.asarray(col)) < 10:
        return True
    else:
        return False