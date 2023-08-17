import axios from "axios";


export default class AxiosUtils {

  static getAUC = async (dataset: string) => {
    return await axios
    .get(
      `${process.env.REACT_APP_API_BASE_URL}/datasets/${dataset}/results/auc`
    )
    .then((response) => response.data)
    .then((data) => {
      return data.auc_score
    });
  }

  static getJSD = async (dataset: string) => {
    return await axios
    .get(
      `${process.env.REACT_APP_API_BASE_URL}/datasets/${dataset}/results/jsd`
    )
    .then((response) => response.data)
    .then((data) => {
      return data.jsd_score
    });
  }

  static getNorm = async (dataset: string) => {
    return await axios
    .get(
      `${process.env.REACT_APP_API_BASE_URL}/datasets/${dataset}/results/norm`
    )
    .then((response) => response.data)
    .then((data) => {
      return data.norm
    });
  }

}
