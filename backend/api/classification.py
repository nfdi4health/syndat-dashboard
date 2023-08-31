import pandas as pd
import numpy as np
import scipy.spatial.distance

from sklearn import ensemble, neighbors, preprocessing
from sklearn.model_selection import cross_val_score

from api.domain import OutlierPredictionMode


def get_auc(real, virtual):
    x = pd.concat([real, virtual])
    y = np.concatenate((np.zeros(real.shape[0]), np.ones(virtual.shape[0])), axis=None)
    rfc = ensemble.RandomForestClassifier()
    return np.average(cross_val_score(rfc, x, y, cv=10, scoring='roc_auc'))


def get_jsd(real, virtual, n_bins=100):
    # load datasets & remove id column
    jsd_arr = []
    for col in real:
        # binning
        if np.sum(real[col].values) % 1 == 0 and np.sum(virtual[col].values) % 1 == 0:
            # categorical column
            real_binned = np.bincount(real[col])
            virtual_binned = np.bincount(virtual[col])
        else:
            # get minimum & maximum of datasets for binning range
            min_val = np.min([np.min(real[col]), np.min(virtual[col])])
            max_val = np.max([np.max(real[col]), np.max(virtual[col])])
            step_size = (np.abs(min_val) + max_val) / n_bins
            # define uniform range (for both real & virtual) for binning
            bins = np.arange(min_val, max_val, step_size)
            real_binned = np.bincount(np.digitize(real[col], bins))
            virtual_binned = np.bincount(np.digitize(virtual[col], bins))
        # one array might be shorter here then the other, e.g. if real patients contain the categorical
        # encoding 0-3, but virtual patients only contain 0-2
        # in this case -> fill missing bin with zero
        if len(real_binned) != len(virtual_binned):
            padding_size = np.abs(len(real_binned) - len(virtual_binned))
            if len(real_binned) > len(virtual_binned):
                virtual_binned = np.pad(virtual_binned, (0, padding_size))
            else:
                real_binned = np.pad(real_binned, (0, padding_size))
        # compute jsd
        jsd = scipy.spatial.distance.jensenshannon(real_binned, virtual_binned)
        jsd_arr.append(jsd)
    return np.average(jsd_arr)


def get_norm_score(real_data, synthetic_data):
    corr_real = real_data.corr()
    corr_synthetic = synthetic_data.corr()
    norm_diff = np.linalg.norm(corr_real - corr_synthetic)
    norm_real = np.linalg.norm(corr_real)
    norm_quotient = norm_diff / norm_real
    return norm_quotient

def get_outliers(virtual_patients, mode=OutlierPredictionMode.isolationForest, anomaly_score=False):
    if mode == OutlierPredictionMode.isolationForest:
        model = ensemble.IsolationForest(random_state=42)
        return outlier_predictions(model, anomaly_score, x=virtual_patients)
    elif mode == OutlierPredictionMode.local_outlier_factor:
        model = neighbors.LocalOutlierFactor(n_neighbors=2)
        return outlier_predictions(model, anomaly_score, x=virtual_patients)


def outlier_predictions(model, anomaly_score, x):
    if anomaly_score:
        model.fit(x)
        return model.score_samples(X=x) * -1
    else:
        predictions = model.fit_predict(X=x)
        outliers_idx = np.array(np.where(predictions == -1))[0]
        return outliers_idx
