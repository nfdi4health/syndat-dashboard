import axios from "axios";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import ReactScoreIndicator from "react-score-indicator";
import ScoreUtils from "../../utils/ScoreUtils";
import { Alert } from "@mui/material";
import "./PrivacyReport.css";

type Props = {
  dataset: string;
};

type PrivacyRisks = {
  singling_out_risk: number;
  inference_risk: number;
  linkability_risk: number;
};

class PrivacyReport extends React.Component<Props, PrivacyRisks> {
  constructor(props: Props) {
    super(props);
    this.state = {
      singling_out_risk: 1,
      inference_risk: 1,
      linkability_risk: 1,
    };
    this.getMetrics();
  }

  // update plots if props (-> dataset) changes
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.dataset !== this.props.dataset) {
      this.getMetrics();
    }
  }

  getMetrics = () => {
    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/risk_singling_out`
      )
      .then((response) => {
        this.setState({ singling_out_risk: response.data.risk });
      })
      .catch((error) => {
        console.log(error);
      });
    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/risk_inference`
      )
      .then((response) => {
        this.setState({ inference_risk: response.data.risk });
      })
      .catch((error) => {
        console.log(error);
      });
    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/risk_linkability`
      )
      .then((response) => {
        this.setState({ linkability_risk: response.data.risk });
      });
  };

  render() {
    return (
      <Container>
        <h2>Privacy Evaluation Results:</h2>
        <Row>
          <Col></Col>
          <Col className="newFeatureAltert">
            {" "}
            <Alert severity="warning">
              Experimental feature, results may deviate.
            </Alert>
            {" "}
          </Col>
          <Col></Col>
        </Row>
        <Row>
          <Col>
            {" "}
            <ReactScoreIndicator
              value={ScoreUtils.calculatePrivacyScore(
                this.state.singling_out_risk
              )}
              maxValue={100}
            />
            <h4>Singling Out Risk Score</h4>
          </Col>
          <Col>
            {" "}
            <ReactScoreIndicator
              value={ScoreUtils.calculateJsdScore(this.state.linkability_risk)}
              maxValue={100}
            />
            <h4>Linkability Risk Score</h4>
          </Col>
          <Col>
            {" "}
            <ReactScoreIndicator
              value={ScoreUtils.calculateNormScore(this.state.inference_risk)}
              maxValue={100}
            />
            <h4>Inferrence Risk Score</h4>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default PrivacyReport;
