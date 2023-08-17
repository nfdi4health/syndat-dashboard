import { CircularProgress } from "@mui/material";
import axios from "axios";
import React from "react";
import DatasetsEvaluationComparisionChart from "../components/results/summary/DatasetsEvaluationComparisionChart";
import AxiosUtils from "../utils/AxiosUtils";
import ScoreUtils from "../utils/ScoreUtils";
import "./ResultsPage.css";

type State = {
  datasets: string[];
  auc: number[];
  jsd: number[];
  norm: number[];
  dataReady: boolean;
};

class ResultsSummaryPage extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      datasets: [],
      auc: [],
      jsd: [],
      norm: [],
      dataReady: false,
    };
    this.getAvailableDatasets();
  }

  getAvailableDatasets() {
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/datasets`)
      .then((response) => response.data)
      .then((data) => {
        data.forEach(async (dataset: string) => {
          console.log(dataset)
          let auc = await AxiosUtils.getAUC(dataset);
          let jsd = await AxiosUtils.getJSD(dataset);
          let norm = await AxiosUtils.getNorm(dataset);
          this.setState({
            datasets: [...this.state.datasets, dataset],
            auc: [...this.state.auc, ScoreUtils.calculateAucScore(auc)],
            jsd: [...this.state.jsd, ScoreUtils.calculateJsdScore(jsd)],
            norm: [...this.state.norm, ScoreUtils.calculateNormScore(norm),],
          });
        });
        console.log(this.state)
      })
      .then(() => {
        this.setState({ dataReady: true });
        console.log("ready")
      });
  }

  renderChart() {
    if (this.state.dataReady === true) {
      return (
        <DatasetsEvaluationComparisionChart
          datasets={this.state.datasets}
          auc={this.state.auc}
          jsd={this.state.jsd}
          norm={this.state.norm}
        />
      );
    } else {
      return <CircularProgress />;
    }
  }

  render() {
    if (this.state.dataReady === true) {
      return (
        <DatasetsEvaluationComparisionChart
          datasets={this.state.datasets}
          auc={this.state.auc}
          jsd={this.state.jsd}
          norm={this.state.norm}
        />
      );
    } else {
      return <CircularProgress />;
    }

  }
}

export default ResultsSummaryPage;
