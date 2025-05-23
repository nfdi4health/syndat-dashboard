import matplotlib
import seaborn as sns
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pandas.plotting import table


def create_violin_plots(real_patients, virtual_patients, store_destination):
    # Check if real and virtual data have the same columns
    if set(real_patients.columns) != set(virtual_patients.columns):
        raise ValueError("Real and virtual patients have different columns. Please check column names and retry.")
    
    for column_name in real_patients.columns:
        matplotlib.use('Agg')
        real_col = real_patients[column_name].to_numpy()
        virtual_col = virtual_patients[column_name].to_numpy()

        # Ensure both columns have the same length
        min_len = min(len(real_col), len(virtual_col))
        real_col = real_col[:min_len]
        virtual_col = virtual_col[:min_len]
        
        # Check for any NaN values and remove them if necessary
        real_col = real_col[~np.isnan(real_col)]
        virtual_col = virtual_col[~np.isnan(virtual_col)]

        plt.figure()
        plt.title(column_name)

        # Create a patient type array and concatenate
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
            # Remove y-labels as they are redundant with the table headers
            ax.set_xticks([])
            table(ax, df.describe().round(2), loc='bottom', colLoc='center', bbox=[0, -0.55, 1, 0.5],
                  colWidths=[.5, .5])

        fig = ax.get_figure()
        matplotlib.pyplot.close()
        fig.savefig(store_destination + "/" + column_name + '.png', bbox_inches="tight")



def create_correlation_plots(real_patients, virtual_patients, store_destination):
    names = ["dec_rp", "dec_vp"]
    for idx, patient_type in enumerate([real_patients, virtual_patients]):
        plt.figure()
        plt.title("Correlation")
        ax = sns.heatmap(patient_type.corr())
        fig = ax.get_figure()
        fig.savefig(store_destination + "/" + names[idx] + '.png', bbox_inches="tight")
