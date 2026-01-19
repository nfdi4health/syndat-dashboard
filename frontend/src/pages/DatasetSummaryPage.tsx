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
  singlingOutRisk: number[];
  linkabilityRisk: number[];
  inferenceRisk: number[];
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
      singlingOutRisk: [],
      linkabilityRisk: [],
      inferenceRisk: [],
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
          console.log(dataset);
          let auc = await AxiosUtils.getAUC(dataset);
          let jsd = await AxiosUtils.getJSD(dataset);
          let norm = await AxiosUtils.getNorm(dataset);
          let singlingOutRisk = await AxiosUtils.getSinglingOutRisk(dataset);
          let inferenceRisk = await AxiosUtils.getInferenceRisk(dataset);
          let linkabilityRisk = await AxiosUtils.getLinkabilityRisk(dataset);
          this.setState({
            datasets: [...this.state.datasets, dataset],
            auc: [...this.state.auc, ScoreUtils.calculateAucScore(auc)],
            jsd: [...this.state.jsd, ScoreUtils.calculateJsdScore(jsd)],
            norm: [...this.state.norm, ScoreUtils.calculateNormScore(norm)],
            singlingOutRisk: [
              ...this.state.singlingOutRisk,
              ScoreUtils.calculatePrivacyScore(singlingOutRisk),
            ],
            inferenceRisk: [
              ...this.state.inferenceRisk,
              ScoreUtils.calculatePrivacyScore(inferenceRisk),
            ],
            linkabilityRisk: [
              ...this.state.linkabilityRisk,
              ScoreUtils.calculatePrivacyScore(linkabilityRisk),
            ],
          });
        });
        console.log(this.state);
      })
      .then(() => {
        this.setState({ dataReady: true });
        console.log("ready");
      });
  }

  render() {
    if (this.state.dataReady === true) {
      return (
        <div className="ResultsPage">
          <section className="card ResultsSection">
            <h2 className="ResultsSection__title">Dataset Summary</h2>
            <p className="muted" style={{ margin: 0 }}>
              Comparison of quality and privacy scores across all stored datasets.
            </p>
          </section>

          <section className="card ResultsSection">
            <h2 className="ResultsSection__title">Quality Summary</h2>
            <DatasetsEvaluationComparisionChart
              datasets={this.state.datasets}
              metric1={this.state.auc}
              metric2={this.state.jsd}
              metric3={this.state.norm}
              metric1Label="ROC Area Under Curve"
              metric2Label="Jensen–Shannon divergence"
              metric3Label="Correlation Quotient"
              plotTitle="Quality Score"
            />
          </section>

          <section className="card ResultsSection">
            <h2 className="ResultsSection__title">Privacy Summary</h2>
            <DatasetsEvaluationComparisionChart
              datasets={this.state.datasets}
              metric1={this.state.singlingOutRisk}
              metric2={this.state.inferenceRisk}
              metric3={this.state.linkabilityRisk}
              metric1Label="Singling Out Risk"
              metric2Label="Inference Risk"
              metric3Label="Linkability Risk"
              plotTitle="Risk Score"
            />
          </section>
        </div>
      );
    } else {
      return (
        <div className="ResultsPage">
          <section className="card ResultsSection" style={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </section>
        </div>
      );
    }
  }
}

export default ResultsSummaryPage;
