import React from "react";
import { Col } from "react-bootstrap";
import { Alert } from "@mui/material";
import axios from "axios";
import ProcessingStatusIndicator from "./ProcessingStatusIndicator";
import MessageUtils, { ValidationReport } from "../../utils/MessageUtils";

type State = {
  processingTriggered: boolean;
  checking: boolean;
  report: ValidationReport | null;
  failureMessage: string;
};

const RESOURCES = [
  "results/auc",
  "results/jsd",
  "results/norm",
  "results/column_types",
  "results/tsne",
  "results/outliers",
  "results/risk_singling_out",
  "results/risk_linkability",
  "results/risk_inference",
  "plots/violin",
  "plots/correlation",
];

class ProcessingPanel extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      processingTriggered: false,
      checking: false,
      report: null,
      failureMessage: "",
    };
  }

  checkPatientData = () => {
    this.setState({
      processingTriggered: false,
      checking: true,
      report: null,
      failureMessage: "",
    });

    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/default/patients/validation`
      )
      .then((response) => {
        const report = MessageUtils.parseReport(response.data);
        if (report && report.valid) {
          // Warnings are advisory, so they never hold up the computation.
          // They stay visible above the progress indicators.
          this.setState({
            checking: false,
            report,
            processingTriggered: true,
          });
          return;
        }
        this.setState({
          checking: false,
          report,
          failureMessage: report
            ? ""
            : "The server returned an unexpected validation report.",
        });
      })
      .catch((error) => {
        this.setState({
          checking: false,
          report: null,
          failureMessage: `Could not validate the patient data: ${MessageUtils.describeError(
            error
          )}`,
        });
      });
  };

  renderFindings = (report: ValidationReport, processingStarted = false) => {
    const { details } = report;
    return (
      <div>
        {report.errors.length > 0 && (
          <Alert severity="error" style={{ marginBottom: "0.5rem" }}>
            <b>Processing cannot start:</b>
            <ul style={{ marginBottom: 0 }}>
              {report.errors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </Alert>
        )}

        {report.warnings.length > 0 && (
          <Alert severity="warning">
            <b>
              {processingStarted
                ? "The data was processed with these caveats:"
                : "Please review the patient data:"}
            </b>
            <ul style={{ marginBottom: 0 }}>
              {report.warnings.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </Alert>
        )}

        {details && (
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {details.shared_columns} shared column(s) &middot;{" "}
            {details.real_rows ?? "–"} real row(s) &middot;{" "}
            {details.synthetic_rows ?? "–"} synthetic row(s)
            {details.processing_rows !== null &&
              details.processing_rows !== undefined &&
              ` · computing on ${details.processing_rows.toLocaleString()} row(s)`}
          </p>
        )}
      </div>
    );
  };

  renderStatusIndicators = () => {
    const { processingTriggered, checking, report, failureMessage } = this.state;

    if (processingTriggered) {
      return (
        <div>
          {report && report.warnings.length > 0 && this.renderFindings(report, true)}
          {RESOURCES.map((resource) => (
            <ProcessingStatusIndicator key={resource} resource={resource} />
          ))}
        </div>
      );
    }

    if (checking) {
      return <Alert severity="info">Checking the uploaded patient data..</Alert>;
    }

    if (failureMessage) {
      return <Alert severity="error">{failureMessage}</Alert>;
    }

    if (report) {
      return this.renderFindings(report);
    }

    return <Alert severity="info">Waiting for processing trigger</Alert>;
  };

  render() {
    return (
      <div>
        <Col>
          <div className="processingTriggerButton">
            <button onClick={this.checkPatientData}>Trigger Result Processing</button>
          </div>
          <div className="triggerResponse">{this.renderStatusIndicators()}</div>
        </Col>
      </div>
    );
  }
}

export default ProcessingPanel;
