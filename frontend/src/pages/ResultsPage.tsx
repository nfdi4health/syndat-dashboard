import { Alert, Button } from "@mui/material";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import ChooseDatasetDropdown from "../components/results/ChooseDatasetDropdown";
import ClassifierReport from "../components/results/ClassifierReport";
import CorrelationPlot from "../components/results/CorrelelationPlot";
import OutlierPlot from "../components/results/OutlierPlot";
import PlotSelector from "../components/results/PlotSelector";
import "./ResultsPage.css";
import PrivacyReport from "../components/results/PrivacyReport";

type State = {
  dataset: string;
};

class ResultsPage extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      dataset: "default",
    };
  }

  switchDataset = (dataset: string | null) => {
    if (dataset !== null) {
      this.setState({ dataset: dataset });
    }
  };

  renderDefaultDatasetAlert() {
    return (
      <Alert severity="info">
        Currently displaying the processed data results of the latest uploaded dataset.
      </Alert>
    );
  }

  render() {
    return (
      <div className="ResultsPage">
        <div className="ResultsPage__toolbar card">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <ChooseDatasetDropdown handler={this.switchDataset} />
            </Col>
            <Col md={5}>
              {this.state.dataset === "default"
                ? this.renderDefaultDatasetAlert()
                : ""}
            </Col>
            <Col md={3} id="button-col">
              <Button
                className="button"
                variant="outlined"
                href="/results/summary"
              >
                Datasets Summary
              </Button>
            </Col>
          </Row>
        </div>
        <ClassifierReport dataset={this.state.dataset} />
        <PrivacyReport dataset={this.state.dataset} />
        <OutlierPlot dataset={this.state.dataset} />
        <PlotSelector dataset={this.state.dataset} />
        <CorrelationPlot dataset={this.state.dataset} />
      </div>
    );
  }
}

export default ResultsPage;
