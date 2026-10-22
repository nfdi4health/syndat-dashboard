import { CircularProgress } from "@mui/material";
import axios from "axios";
import React from "react";
import DatasetsEvaluationComparisionChart from "../components/results/summary/DatasetsEvaluationComparisionChart";
import AxiosUtils from "../utils/AxiosUtils";
import ScoreUtils from "../utils/ScoreUtils";
import "./ResultsPage.css";

type Metric = number | null;

type State = {
  datasets: string[];
  auc: Metric[];
  jsd: Metric[];
  norm: Metric[];
  singlingOutRisk: Metric[];
  linkabilityRisk: Metric[];
  inferenceRisk: Metric[];
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

  async getAvailableDatasets() {
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/datasets`
    );
    const datasets: string[] = response.data;
    const results = await Promise.all(
      datasets.map(async (dataset) => {
        const auc = await AxiosUtils.getAUC(dataset);
        const jsd = await AxiosUtils.getJSD(dataset);
        const norm = await AxiosUtils.getNorm(dataset);
        const singlingOutRisk = await AxiosUtils.getSinglingOutRisk(dataset);
        const inferenceRisk = await AxiosUtils.getInferenceRisk(dataset);
        const linkabilityRisk = await AxiosUtils.getLinkabilityRisk(dataset);
        return {
          dataset,
          auc,
          jsd,
          norm,
          singlingOutRisk,
          inferenceRisk,
          linkabilityRisk,
        };
      })
    );
    this.setState({
      datasets: results.map((result) => result.dataset),
      auc: results.map((result) => ScoreUtils.calculateAucScore(result.auc)),
      jsd: results.map((result) => ScoreUtils.calculateJsdScore(result.jsd)),
      norm: results.map((result) => ScoreUtils.calculateNormScore(result.norm)),
      singlingOutRisk: results.map((result) =>
        ScoreUtils.displayPrivacyScore(result.singlingOutRisk)
      ),
      inferenceRisk: results.map((result) =>
        ScoreUtils.displayPrivacyScore(result.inferenceRisk)
      ),
      linkabilityRisk: results.map((result) =>
        ScoreUtils.displayPrivacyScore(result.linkabilityRisk)
      ),
      dataReady: true,
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
