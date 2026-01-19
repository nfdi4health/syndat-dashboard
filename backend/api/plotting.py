import matplotlib
import seaborn as sns
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pandas.plotting import table
from pandas.core.dtypes.common import is_numeric_dtype


def create_violin_plots(real_patients, virtual_patients, store_destination):
    # Check if real and virtual data have the same columns
    if set(real_patients.columns) != set(virtual_patients.columns):
        raise ValueError("Real and virtual patients have different columns. Please check column names and retry.")
    
    for column_name in real_patients.columns:
        matplotlib.use('Agg')
        real_series = real_patients[column_name]
        virtual_series = virtual_patients[column_name]

        # Ensure both columns have the same length
        min_len = min(len(real_series), len(virtual_series))
        real_series = real_series.iloc[:min_len]
        virtual_series = virtual_series.iloc[:min_len]

        plt.figure()
        plt.title(column_name)

        if is_numeric_dtype(real_series):
            real_num = pd.to_numeric(real_series, errors="coerce").dropna().to_numpy()
            virtual_num = pd.to_numeric(virtual_series, errors="coerce").dropna().to_numpy()
            min_len_num = min(len(real_num), len(virtual_num))
            real_num = real_num[:min_len_num]
            virtual_num = virtual_num[:min_len_num]

            if min_len_num == 0:
                ax = plt.gca()
                ax.axis('off')
                ax.text(0.5, 0.5, "No numeric data after cleaning", ha='center', va='center')
            else:
                df = pd.DataFrame(data={"real": real_num, "synthetic": virtual_num})
                ax = sns.violinplot(data=df)
                ax.set_xticks([])
                table(
                    ax,
                    df.describe().round(2),
                    loc='bottom',
                    colLoc='center',
                    bbox=[0, -0.55, 1, 0.5],
                    colWidths=[.5, .5],
                )
        else:
            real_cat = real_series.astype("string").fillna("__MISSING__")
            virtual_cat = virtual_series.astype("string").fillna("__MISSING__")
            df = pd.DataFrame(
                data={
                    "type": ["real"] * len(real_cat) + ["synthetic"] * len(virtual_cat),
                    "value": pd.concat([real_cat, virtual_cat], ignore_index=True),
                }
            )
            ax = sns.countplot(data=df, x="value", hue="type", order=df['value'].value_counts().index)

        fig = ax.get_figure()
        matplotlib.pyplot.close()
        fig.savefig(store_destination + "/" + column_name + '.png', bbox_inches="tight")



def create_correlation_plots(real_patients, virtual_patients, store_destination):
    names = ["dec_rp", "dec_vp"]
    for idx, patient_type in enumerate([real_patients, virtual_patients]):
        plt.figure()
        plt.title("Correlation")
        numeric_df = patient_type.select_dtypes(include=[np.number])
        if numeric_df.shape[1] == 0:
            ax = plt.gca()
            ax.axis('off')
            ax.text(0.5, 0.5, "No numeric columns for correlation", ha='center', va='center')
        else:
            ax = sns.heatmap(numeric_df.corr())
        fig = ax.get_figure()
        fig.savefig(store_destination + "/" + names[idx] + '.png', bbox_inches="tight")
