import subprocess

import numpy as np

from api import classification, visualization, data_loader, filtering, plotting
from api.classification import get_frobenius_norm
from api.data_loader import encode_numerical_columns


def process_rp_vp_results(input_dir, output_dir, plot_dir):
    # load datasets
    try:
        print("Loading Data..")
        real, virtual = data_loader.load_data_decoded(input_dir)
    except Exception as ex:
        create_error_log(str(ex))
    # AUC and JSD
    try:
        print("Calculating AUC and JSD..")
        real_encode_cat = encode_numerical_columns(real)
        virtual_encode_cat = encode_numerical_columns(virtual)
        auc = classification.get_auc(real_encode_cat, virtual_encode_cat)
        np.save(output_dir + "/auc.npy", auc)
        jsd = classification.get_jsd(real_encode_cat, virtual_encode_cat)
        np.save(output_dir + "/jsd.npy", jsd)
        print("Calculating Frobenius norms..")
        norm_real, norm_virtual = get_frobenius_norm(real_encode_cat, virtual_encode_cat)
        np.save(output_dir + "/norm_real.npy", norm_real)
        np.save(output_dir + "/norm_virtual.npy", norm_virtual)
    except Exception as ex:
        create_error_log(str(ex))
    # get column types for "patients like me" rendering
    try:
        print("Getting Column Types..")
        column_types = filtering.get_column_types(real)
        np.save(output_dir + "/column_types.npy", column_types)
    except Exception as ex:
        create_error_log(str(ex))
    # outlier plot
    try:
        print("Generating Plot Data..")
        # visualize a maximum of 1000 patient entities each
        if real.shape[0] > 1000:
            real_subsampled = real_encode_cat.sample(1000)
            virtual_subsampled = virtual_encode_cat.sample(1000)
            x_real, y_real, x_virtual, y_virtual = visualization.get_tsne_plot_data(real_subsampled, virtual_subsampled)
        else:
            x_real, y_real, x_virtual, y_virtual = visualization.get_tsne_plot_data(real_encode_cat, virtual_encode_cat)
        np.save(output_dir + "/x_real.npy", x_real)
        np.save(output_dir + "/y_real.npy", y_real)
        np.save(output_dir + "/x_virtual.npy", x_virtual)
        np.save(output_dir + "/y_virtual.npy", y_virtual)
        outlier_scores = classification.get_outliers(virtual, anomaly_score=True)
        np.save(output_dir + "/anomaly_scores.npy", outlier_scores)
    except Exception as ex:
        create_error_log(str(ex))
    try:
        print("Generating violin and correlation plots..")
        plotting.create_violin_plots(real, virtual, plot_dir + "/violin")
        plotting.create_correlation_plots(real, virtual, plot_dir + "/correlation")
    except Exception as ex:
        create_error_log(str(ex))
    print("Done!")


def create_error_log(msg):
    print("Error occurred:")
    print(msg)
    f = open("error.txt", "a+")
    f.write(msg + "\n")
