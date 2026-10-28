import numpy as np
import pandas as pd
import pytest
import syndat

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


def test_score_helpers_delegate_to_syndat_metrics(monkeypatch, real_data, similar_synthetic):
    # The direct metrics are already in the units the frontend consumes, so the
    # helpers must not re-derive them from the 0-100 complexity scores.
    calls = {}

    def fake_auc(real, synthetic, **kwargs):
        calls["auc"] = True
        return 0.73

    def fake_jsd(real, synthetic, **kwargs):
        calls["jsd"] = True
        return {"a": 0.2, "b": 0.4}

    def fake_norm(real, synthetic, **kwargs):
        calls["norm"] = True
        return 0.25

    monkeypatch.setattr(syndat.metrics, "discriminator_auc", fake_auc)
    monkeypatch.setattr(syndat.metrics, "jensen_shannon_distance", fake_jsd)
    monkeypatch.setattr(syndat.metrics, "normalized_correlation_difference", fake_norm)

    assert classification.get_auc(real_data, similar_synthetic) == 0.73
    assert classification.get_jsd(real_data, similar_synthetic) == pytest.approx(0.3)
    assert classification.get_norm_score(real_data, similar_synthetic) == 0.25
    assert calls == {"auc": True, "jsd": True, "norm": True}


def test_norm_score_clamps_quotients_above_one(monkeypatch, real_data, similar_synthetic):
    # Opposing correlation structure can push the quotient past 1.
    monkeypatch.setattr(
        syndat.metrics,
        "normalized_correlation_difference",
        lambda *args, **kwargs: 1.7,
    )

    assert classification.get_norm_score(real_data, similar_synthetic) == 1.0


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
