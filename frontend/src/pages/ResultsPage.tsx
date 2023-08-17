import { Alert, Button } from "@mui/material";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import ChooseDatasetDropdown from "../components/results/ChooseDatasetDropdown";
import ClassifierReport from "../components/results/ClassifierReport";
import CorrelationPlot from "../components/results/CorrelelationPlot";
import OutlierPlot from "../components/results/OutlierPlot";
import PatientSearchForm from "../components/results/PatientSearchForm";
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
      <Container>
        <Alert severity="info">Currently displaying the processed data results of the latest uploaded dataset.</Alert>
      </Container>
    );
  }

  render() {
    return (
      <div className="ResultsPage">
        <Container>
          <Row>
            <Col>
              <ChooseDatasetDropdown handler={this.switchDataset} />
            </Col>
            <Col>
              {this.state.dataset === "default"
                ? this.renderDefaultDatasetAlert()
                : ""}
            </Col>
            <Col id="button-col">
              <Button
                className="button"
                variant="outlined"
                href="/results/summary"
              >
                Datasets Summary
              </Button>
            </Col>
          </Row>
        </Container>
        <ClassifierReport dataset={this.state.dataset} />
        <PrivacyReport dataset={this.state.dataset} />
        <OutlierPlot dataset={this.state.dataset} />
        <PlotSelector dataset={this.state.dataset} />
        <CorrelationPlot dataset={this.state.dataset} />
        <PatientSearchForm dataset={this.state.dataset} />
      </div>
    );
  }
}

export default ResultsPage;
