import matplotlib
import seaborn as sns
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pandas.plotting import table


def create_violin_plots(real_patients, virtual_patients, store_destination):
    for column_name in real_patients.columns:
        matplotlib.use('Agg')
        real_col = real_patients[column_name].to_numpy()
        virtual_col = virtual_patients[column_name].to_numpy()
        plt.figure()
        plt.title(column_name)
        patient_types = np.concatenate([np.zeros(real_col.size), np.ones(virtual_col.size)])
        df = pd.DataFrame(data={"type": np.where(patient_types == 0, "real", "synthetic"),
                                "value": np.concatenate([real_col, virtual_col])})
        if real_col.dtype == str or real_col.dtype == object:
            ax = sns.countplot(data=df, x="value", hue="type", order=df['value'].value_counts().index)
        elif np.sum(real_col) % 1 == 0 and np.max(real_col) < 10:
            ax = sns.countplot(data=df, x="value", hue="type")
        else:
            df = pd.DataFrame(data={"real": real_col, "synthetic": virtual_col})
            ax = sns.violinplot(data=df)
            # remove y-labels as they are redundant with the table headers
            ax.set_xticks([])
            table(ax, df.describe().round(2), loc='bottom', colLoc='center', bbox=[0, -0.55, 1, 0.5],
                  colWidths=[.5, .5])
        fig = ax.get_figure()
        fig.savefig(store_destination + "/" + column_name + '.png', bbox_inches="tight")


def create_correlation_plots(real_patients, virtual_patients, store_destination):
    names = ["dec_rp", "dec_vp"]
    for idx, patient_type in enumerate([real_patients, virtual_patients]):
        plt.figure()
        plt.title("Correlation")
        ax = sns.heatmap(patient_type.corr())
        fig = ax.get_figure()
        fig.savefig(store_destination + "/" + names[idx] + '.png', bbox_inches="tight")
