import numpy as np
from anonymeter.evaluators import SinglingOutEvaluator, LinkabilityEvaluator, InferenceEvaluator


def get_singling_out_risk(real_data, synthetic_data, control_data=None, n_attacks=100):
    if real_data is None or synthetic_data is None:
        return np.nan
    if real_data.shape[0] == 0 or synthetic_data.shape[0] == 0:
        return np.nan
    if real_data.shape[0] < n_attacks:
        n_attacks = real_data.shape[0]
    n_attacks = min(n_attacks, synthetic_data.shape[0])
    if n_attacks <= 0:
        return np.nan
    so_evaluator = SinglingOutEvaluator(ori=real_data,
                                        syn=synthetic_data,
                                        control=control_data,
                                        n_attacks=n_attacks)
    so_evaluator.evaluate(mode='univariate')
    return so_evaluator.risk().value


def get_linkability_risk(real_data, synthetic_data, control_data=None, n_attacks=100):
    if real_data is None or synthetic_data is None:
        return np.nan
    if real_data.shape[0] == 0 or synthetic_data.shape[0] == 0:
        return np.nan
    if real_data.shape[1] < 2:
        return np.nan
    if real_data.shape[0] < n_attacks:
        n_attacks = real_data.shape[0]
    n_attacks = min(n_attacks, synthetic_data.shape[0])
    if n_attacks <= 0:
        return np.nan
    aux_cols = split_list(real_data.columns.to_list())
    so_evaluator = LinkabilityEvaluator(ori=real_data,
                                        syn=synthetic_data,
                                        control=control_data,
                                        aux_cols=aux_cols,
                                        n_attacks=n_attacks)
    so_evaluator.evaluate()
    return so_evaluator.risk().value


def get_inference_risk(real_data, synthetic_data, control_data=None, n_attacks=1000):
    if real_data is None or synthetic_data is None:
        return np.nan
    if real_data.shape[0] == 0 or synthetic_data.shape[0] == 0:
        return np.nan
    if real_data.shape[1] < 2:
        return np.nan
    if real_data.shape[0] < n_attacks:
        n_attacks = real_data.shape[0]
    n_attacks = min(n_attacks, synthetic_data.shape[0])
    if n_attacks <= 0:
        return np.nan
    columns = real_data.columns
    results = []
    for secret in columns:
        aux_cols = [col for col in columns if col != secret]
        if len(aux_cols) == 0:
            continue
        evaluator = InferenceEvaluator(ori=real_data,
                                       syn=synthetic_data,
                                       control=control_data,
                                       aux_cols=aux_cols,
                                       secret=secret,
                                       n_attacks=n_attacks)
        evaluator.evaluate(n_jobs=-2)
        results.append((secret, evaluator.results()))

    if len(results) == 0:
        return np.nan

    return np.average([res[1].risk().value for res in results])


def split_list(a_list):
    half = len(a_list)//2
    return a_list[:half], a_list[half:]