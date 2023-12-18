import axios from "axios";
import React from "react";
import { Col, Container, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";
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

  colors = [
    "#53b83a",
    "#84c42b",
    "#f1bc00",
    "#ed8d00",
    "#ed8d00",
    "#d12000",
    "#d12000",
    "#d12000",
  ];

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

  renderTooltipSinglingOut = (props: any) => (
    <Tooltip id="button-tooltip" {...props}>
      Singling out risk involves identifying rare or unique attributes in
      synthetic data that could potentially reveal specific individuals in the
      original dataset, potentially leading to privacy breaches.
    </Tooltip>
  );

  renderTooltipLinkability = (props: any) => (
    <Tooltip id="button-tooltip" {...props}>
      Linkability risk is the concern that, using the synthetic dataset, one can
      determine if two separate sets of attributes belong to the same individual
      in external datasets A and B, assuming that these attributes are also
      found in the synthetic data.
    </Tooltip>
  );

  renderTooltipInferrence = (props: any) => (
    <Tooltip id="button-tooltip" {...props}>
      Inference risk pertains to the ability of an attacker, who knows the
      values of certain attributes for specific target records, to accurately
      deduce secret attributes of those targets using the synthetic dataset.
    </Tooltip>
  );

  render() {
    return (
      <Container>
        <h2>Privacy Evaluation Results:</h2>
        <Row>
          <Col></Col>
          <Col className="citationBox">
            {" "}
            <Alert severity="info">
              <b>Displayed Metrics are based on:</b><br/>
              Giomi, Matteo, et al. "A Unified Framework for Quantifying Privacy
              Risk in Synthetic Data." <i>arXiv</i> preprint{" "}
              <a href="https://arxiv.org/abs/2211.10459">arXiv:2211.10459</a>{" "}
              (2022).
            </Alert>
          </Col>
          <Col></Col>
        </Row>
        <Row>
          <Col>
            {" "}
            <ReactScoreIndicator
              value={
                100 -
                ScoreUtils.calculatePrivacyScore(this.state.singling_out_risk)
              }
              maxValue={100}
              stepsColors={this.colors}
            />
            <h4>Singling Out Risk</h4>
            <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={this.renderTooltipSinglingOut}
            >
              <InfoCircle />
            </OverlayTrigger>
          </Col>
          <Col>
            {" "}
            <ReactScoreIndicator
              value={
                100 -
                ScoreUtils.calculatePrivacyScore(this.state.linkability_risk)
              }
              maxValue={100}
              stepsColors={this.colors}
            />
            <h4>Linkability Risk</h4>
            <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={this.renderTooltipLinkability}
            >
              <InfoCircle />
            </OverlayTrigger>
          </Col>
          <Col>
            {" "}
            <ReactScoreIndicator
              value={
                100 -
                ScoreUtils.calculatePrivacyScore(this.state.inference_risk)
              }
              maxValue={100}
              stepsColors={this.colors}
            />
            <h4>Inferrence Risk</h4>
            <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={this.renderTooltipInferrence}
            >
              <InfoCircle />
            </OverlayTrigger>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default PrivacyReport;
