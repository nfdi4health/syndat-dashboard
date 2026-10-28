import { Alert, CircularProgress } from "@mui/material";
import axios from "axios";
import React from "react";
import DatasetsEvaluationComparisionChart from "../components/results/summary/DatasetsEvaluationComparisionChart";
import AxiosUtils from "../utils/AxiosUtils";
import ScoreUtils from "../utils/ScoreUtils";
import "./ResultsPage.css";

type Metric = number | null;

type MetricKey =
  | "auc"
  | "jsd"
  | "norm"
  | "singlingOutRisk"
  | "linkabilityRisk"
  | "inferenceRisk";

type State = {
  datasets: string[];
  auc: Metric[];
  jsd: Metric[];
  norm: Metric[];
  singlingOutRisk: Metric[];
  linkabilityRisk: Metric[];
  inferenceRisk: Metric[];
  dataReady: boolean;
  error: string | null;
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
      error: null,
    };
    this.getAvailableDatasets();
  }

  async getAvailableDatasets() {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets`
      );
      const datasets: string[] = response.data;

      this.setState({
        datasets,
        auc: datasets.map(() => null),
        jsd: datasets.map(() => null),
        norm: datasets.map(() => null),
        singlingOutRisk: datasets.map(() => null),
        linkabilityRisk: datasets.map(() => null),
        inferenceRisk: datasets.map(() => null),
        dataReady: true,
        error: null,
      });

      datasets.forEach((dataset, index) => {
        this.loadMetric(dataset, index, "auc", AxiosUtils.getAUC);
        this.loadMetric(dataset, index, "jsd", AxiosUtils.getJSD);
        this.loadMetric(dataset, index, "norm", AxiosUtils.getNorm);
        this.loadMetric(
          dataset,
          index,
          "singlingOutRisk",
          AxiosUtils.getSinglingOutRisk
        );
        this.loadMetric(
          dataset,
          index,
          "linkabilityRisk",
          AxiosUtils.getLinkabilityRisk
        );
        this.loadMetric(
          dataset,
          index,
          "inferenceRisk",
          AxiosUtils.getInferenceRisk
        );
      });
    } catch (error) {
      this.setState({
        dataReady: false,
        error:
          "Failed to load the dataset summary. The API may be unavailable or the data could not be read.",
      });
    }
  }

  loadMetric = <K extends MetricKey>(
    dataset: string,
    index: number,
    key: K,
    loader: (dataset: string) => Promise<number | undefined>
  ) => {
    void loader(dataset).then((raw) => {
      const value = this.toDisplayScore(key, raw);
      this.setState((state) => {
        const current = state[key];
        if (index >= current.length) return null;
        const next = current.slice();
        next[index] = value;
        return { [key]: next } as Pick<State, K>;
      });
    });
  };

  toDisplayScore = (key: MetricKey, raw: number | undefined): Metric | null => {
    if (key === "auc") return ScoreUtils.calculateAucScore(raw ?? null);
    if (key === "jsd") return ScoreUtils.calculateJsdScore(raw ?? null);
    if (key === "norm") return ScoreUtils.calculateNormScore(raw ?? null);
    return ScoreUtils.displayPrivacyScore(raw ?? null);
  };

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
          <section
            className="card ResultsSection"
            style={{ display: "flex", justifyContent: "center" }}
          >
            {this.state.error ? (
              <Alert severity="warning" style={{ width: "100%" }}>
                {this.state.error}
              </Alert>
            ) : (
              <CircularProgress />
            )}
          </section>
        </div>
      );
    }
  }
}

export default ResultsSummaryPage;
