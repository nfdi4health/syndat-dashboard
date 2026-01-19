import pandas
import plotly.graph_objects as go

from sklearn.manifold import TSNE

from api.classification import get_outliers
from api.data_loader import load_data_decoded


def get_tsne_plot_data(real, virtual):
    x = pandas.concat([real, virtual])
    n_samples = x.shape[0]
    if n_samples < 2:
        return (
            pandas.Series(dtype=float).to_numpy(),
            pandas.Series(dtype=float).to_numpy(),
            pandas.Series(dtype=float).to_numpy(),
            pandas.Series(dtype=float).to_numpy(),
        )

    # Per scikit-learn: perplexity must be < n_samples.
    # Choose a conservative value for small datasets.
    perplexity = min(30, max(1, (n_samples - 1) // 3))
    perplexity = min(perplexity, n_samples - 1)
    tsne = TSNE(n_components=2, perplexity=perplexity, random_state=42)
    tsne_result = tsne.fit_transform(x)
    border = real.shape[0]
    x_real = tsne_result[:border, 0]
    y_real = tsne_result[:border, 1]
    x_virtual = tsne_result[border:, 0]
    y_virtual = tsne_result[border:, 1]
    return x_real, y_real, x_virtual, y_virtual


def get_outlier_plot():
    real, virtual = load_data_decoded()
    trace_real, trace_virtual = get_tsne_plot_data(real, virtual)
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=trace_real["x"], y=trace_real["y"], mode="markers", name='real'))
    fig.add_trace(go.Scatter(x=trace_virtual['x'], y=trace_virtual['y'], mode="markers", name='virtual'))
    # Add outlier markings for virtual patients
    outliers = get_outliers(virtual)
    for outlier in outliers:
        x0 = trace_virtual['x'][outlier] - 0.5
        y0 = trace_virtual['y'][outlier] - 0.5
        x1 = trace_virtual['x'][outlier] + 0.5
        y1 = trace_virtual['y'][outlier] + 0.5
        fig.add_shape(type="circle", xref="x", yref="y", x0=x0, y0=y0, x1=x1, y1=y1, line_color="LightSeaGreen", )
    # display
    fig.show()





