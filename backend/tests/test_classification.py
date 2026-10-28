import numpy as np
import pandas as pd
import pytest

from api import classification


@pytest.fixture
def real_data():
    rng = np.random.default_rng(0)
    return pd.DataFrame(
        {
            "a": rng.normal(0, 1, 200),
            "b": rng.normal(0, 1, 200),
        }
    )


@pytest.fixture
def similar_synthetic(real_data):
    return real_data.copy()


@pytest.fixture
def different_synthetic():
    rng = np.random.default_rng(1)
    return pd.DataFrame(
        {
            "a": rng.normal(10, 5, 200),
            "b": rng.normal(-10, 5, 200),
        }
    )


def test_get_auc_uses_installed_syndat_api(real_data, similar_synthetic):
    # Regression guard for #138: syndat>=0.13 dropped scores.auc/score= keyword.
    score = classification.get_auc(real_data, similar_synthetic)

    assert np.isfinite(score)


def test_get_jsd_uses_installed_syndat_api(real_data, similar_synthetic):
    score = classification.get_jsd(real_data, similar_synthetic)

    assert np.isfinite(score)


def test_get_norm_score_uses_installed_syndat_api(real_data, similar_synthetic):
    score = classification.get_norm_score(real_data, similar_synthetic)

    assert np.isfinite(score)


def test_auc_keeps_legacy_raw_roc_auc_contract(real_data, similar_synthetic, different_synthetic):
    # The frontend rescales a raw ROC AUC in [0.5, 1.0] where 0.5 is best.
    similar = classification.get_auc(real_data, similar_synthetic)
    different = classification.get_auc(real_data, different_synthetic)

    assert 0.5 <= similar <= 1.0
    assert 0.5 <= different <= 1.0
    assert similar < different


def test_jsd_keeps_legacy_distance_contract(real_data, similar_synthetic, different_synthetic):
    # The frontend expects a distance-like value in [0, 1] where 0 is best.
    similar = classification.get_jsd(real_data, similar_synthetic)
    different = classification.get_jsd(real_data, different_synthetic)

    assert 0.0 <= similar <= 1.0
    assert 0.0 <= different <= 1.0
    assert similar < different


def test_norm_score_keeps_legacy_quotient_contract(real_data, similar_synthetic, different_synthetic):
    # The frontend expects a distance-like value in [0, 1] where 0 is best.
    similar = classification.get_norm_score(real_data, similar_synthetic)
    different = classification.get_norm_score(real_data, different_synthetic)

    assert 0.0 <= similar <= 1.0
    assert 0.0 <= different <= 1.0
    assert similar < different


def test_score_helpers_handle_empty_input_gracefully(real_data, similar_synthetic):
    empty = real_data.iloc[0:0]

    assert np.isnan(classification.get_auc(empty, similar_synthetic))
    assert np.isnan(classification.get_jsd(empty, similar_synthetic))
    assert np.isnan(classification.get_norm_score(empty, similar_synthetic))
    assert np.isnan(classification.get_auc(None, similar_synthetic))
    assert np.isnan(classification.get_jsd(real_data, None))
    assert np.isnan(classification.get_norm_score(None, None))
