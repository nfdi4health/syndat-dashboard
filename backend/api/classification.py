import pandas as pd
import numpy as np
import syndat

from sklearn import ensemble, neighbors, preprocessing
from sklearn.model_selection import cross_val_score

from api.domain import OutlierPredictionMode


def get_auc(real, virtual):
    # syndat>=0.13 reports a 0-100 discrimination score (100 == indistinguishable,
    # i.e. faithful synthetic data). The frontend expects the legacy raw ROC AUC
    # in [0.5, 1.0] where 0.5 means the classifier cannot tell the sets apart.
    if real is None or virtual is None or real.shape[0] == 0 or virtual.shape[0] == 0:
        return np.nan
    return 1 - syndat.scores.discrimination(real, virtual) / 200


def get_jsd(real, virtual):
    if real is None or virtual is None or real.shape[0] == 0 or virtual.shape[0] == 0:
        return np.nan
    return 1 - syndat.scores.distribution(real, virtual) / 100


def get_norm_score(real_data, synthetic_data):
    if real_data is None or synthetic_data is None or real_data.shape[0] == 0 or synthetic_data.shape[0] == 0:
        return np.nan
    return 1 - syndat.scores.correlation(real_data, synthetic_data) / 100

def get_outliers(virtual_patients, mode=OutlierPredictionMode.isolationForest, anomaly_score=False):
    if mode == OutlierPredictionMode.isolationForest:
        model = ensemble.IsolationForest(random_state=42)
        return outlier_predictions(model, anomaly_score, x=virtual_patients)
    elif mode == OutlierPredictionMode.local_outlier_factor:
        model = neighbors.LocalOutlierFactor(n_neighbors=2)
        return outlier_predictions(model, anomaly_score, x=virtual_patients)


def outlier_predictions(model, anomaly_score, x):
    if x is None or getattr(x, "shape", (0,))[0] == 0:
        return np.array([], dtype=float if anomaly_score else int)
    if anomaly_score:
        model.fit(x)
        return model.score_samples(X=x) * -1
    else:
        predictions = model.fit_predict(X=x)
        outliers_idx = np.array(np.where(predictions == -1))[0]
        return outliers_idx
