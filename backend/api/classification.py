import pandas as pd
import numpy as np
import syndat

from sklearn import ensemble, neighbors, preprocessing
from sklearn.model_selection import cross_val_score

from api.domain import OutlierPredictionMode


def get_auc(real, virtual):
    return syndat.scores.auc(real, virtual, score=False)


def get_jsd(real, virtual):
    return syndat.scores.jsd(real, virtual, score=False)


def get_norm_score(real_data, synthetic_data):
    return syndat.scores.correlation(real_data, synthetic_data, score=False)

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
