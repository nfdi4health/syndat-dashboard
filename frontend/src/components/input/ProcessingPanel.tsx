import React from "react";
import { Col, Container } from "react-bootstrap";
import { Alert } from "@mui/material";
import ProcessingStatusIndicator from "./ProcessingStatusIndicator copy";

type State = {
  processingTriggered: Boolean;
};

class ProcessingPanel extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      processingTriggered: false,
    };
  }

  toggleTriggerStatus = () => {
    this.setState({ processingTriggered: true });
    console.log(this.state.processingTriggered);
  };

  renderStatusIndicators = () => {
    if (this.state.processingTriggered) {
      return (
        <div>
          <ProcessingStatusIndicator resource={"results/auc"} />
          <ProcessingStatusIndicator resource={"results/jsd"} />
          <ProcessingStatusIndicator resource={"results/norm"} />
          <ProcessingStatusIndicator resource={"results/column_types"} />
          <ProcessingStatusIndicator resource={"results/tsne"} />
          <ProcessingStatusIndicator resource={"results/outliers"} />
          <ProcessingStatusIndicator resource={"results/risk_singling_out"} />
          <ProcessingStatusIndicator resource={"results/risk_linkability"} />
          <ProcessingStatusIndicator resource={"results/risk_inference"} />
          <ProcessingStatusIndicator resource={"plots/violin"} />
          <ProcessingStatusIndicator resource={"plots/correlation"} />
        </div>
      );
    }
    return <Alert severity="info">Waiting for processing trigger</Alert>;
  };

  render() {
    return (
      <Container>
        <Col>
          <div className="processingTriggerButton">
            <button onClick={this.toggleTriggerStatus}>
              Trigger Result Processing
            </button>
          </div>
          <div className="triggerResponse">{this.renderStatusIndicators()}</div>
        </Col>
        <Col></Col>
      </Container>
    );
  }
}

export default ProcessingPanel;
