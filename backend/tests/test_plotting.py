import numpy as np
import pandas as pd
import pytest

from api import plotting


@pytest.fixture
def capture_heatmap(monkeypatch):
    calls = []
    import seaborn as sns

    original = sns.heatmap

    def spy(data, **kwargs):
        calls.append(kwargs)
        return original(data, **kwargs)

    monkeypatch.setattr(sns, "heatmap", spy)
    return calls


def test_correlation_plots_share_color_scale(capture_heatmap, tmp_path):
    rng = np.random.default_rng(0)
    real = pd.DataFrame({"a": np.arange(10.0), "b": np.arange(10.0)})
    virtual = pd.DataFrame(
        {"a": rng.normal(size=50), "b": rng.normal(size=50)}
    )

    plotting.create_correlation_plots(real, virtual, str(tmp_path))

    assert len(capture_heatmap) == 2
    assert capture_heatmap[0]["vmin"] == capture_heatmap[1]["vmin"]
    assert capture_heatmap[0]["vmax"] == capture_heatmap[1]["vmax"]
    assert (tmp_path / "dec_rp.png").exists()
    assert (tmp_path / "dec_vp.png").exists()


def test_correlation_plots_handle_missing_numeric_columns(capture_heatmap, tmp_path):
    real = pd.DataFrame({"a": np.arange(5.0), "b": np.arange(5.0)})
    virtual = pd.DataFrame({"a": ["x", "y"], "b": ["z", "w"]})

    plotting.create_correlation_plots(real, virtual, str(tmp_path))

    assert len(capture_heatmap) == 1
    assert (tmp_path / "dec_rp.png").exists()
    assert (tmp_path / "dec_vp.png").exists()
