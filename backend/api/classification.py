import pandas as pd
import numpy as np
import syndat

from sklearn import ensemble, neighbors, preprocessing
from sklearn.model_selection import cross_val_score

from api.domain import OutlierPredictionMode


def _is_empty(data):
    return data is None or data.shape[0] == 0


def get_auc(real, virtual):
    # Raw ROC AUC of a classifier separating real from synthetic samples. This is
    # the legacy contract the frontend rescales: 0.5 means indistinguishable, so
    # clamp away float noise and inverted classifiers below chance.
    if _is_empty(real) or _is_empty(virtual):
        return np.nan
    return float(max(syndat.metrics.discriminator_auc(real, virtual), 0.5))


def get_jsd(real, virtual):
    # Mean per-feature Jensen-Shannon distance in [0, 1], where 0 is identical.
    if _is_empty(real) or _is_empty(virtual):
        return np.nan
    distances = syndat.metrics.jensen_shannon_distance(real, virtual)
    if not distances:
        return np.nan
    return float(np.mean(list(distances.values())))


def get_norm_score(real_data, synthetic_data):
    # Norm quotient of the real and synthetic correlation matrices: 0 for equal
    # correlation structure and 1 for completely different ones. The quotient can
    # exceed 1 when correlations oppose each other, so clamp it to the [0, 1]
    # range the frontend expects.
    if _is_empty(real_data) or _is_empty(synthetic_data):
        return np.nan
    quotient = syndat.metrics.normalized_correlation_difference(real_data, synthetic_data)
    return float(min(max(quotient, 0.0), 1.0))

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
