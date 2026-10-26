import axios from "axios";
import React from "react";
import { Alert, Col, Container, OverlayTrigger, Popover, Row, Spinner } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";
import ScoreIndicator from "../shared/ScoreIndicator";
import ScoreUtils from "../../utils/ScoreUtils";
import "./PrivacyReport.css";

type Props = {
  dataset: string;
};

type PrivacyRisks = {
  singling_out_risk: number | null;
  inference_risk: number | null;
  linkability_risk: number | null;
  isLoading: boolean;
  error: string | null;
};

class PrivacyReport extends React.Component<Props, PrivacyRisks> {
  constructor(props: Props) {
    super(props);
    this.state = {
      singling_out_risk: null,
      inference_risk: null,
      linkability_risk: null,
      isLoading: true,
      error: null,
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
    this.setState({ isLoading: true, error: null });
    const resultsUrl = `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results`;
    Promise.all([
      axios
        .get(`${resultsUrl}/risk_singling_out`)
        .then((response) => response.data.risk)
        .catch(() => null),
      axios
        .get(`${resultsUrl}/risk_inference`)
        .then((response) => response.data.risk)
        .catch(() => null),
      axios
        .get(`${resultsUrl}/risk_linkability`)
        .then((response) => response.data.risk)
        .catch(() => null),
    ]).then(([singling_out_risk, inference_risk, linkability_risk]) => {
      const allFailed =
        singling_out_risk === null &&
        inference_risk === null &&
        linkability_risk === null;
      this.setState({
        singling_out_risk,
        inference_risk,
        linkability_risk,
        isLoading: false,
        error: allFailed
          ? "Failed to load privacy risks. The API may be unavailable or the data could not be read."
          : null,
      });
    });
  };

  renderScore(value: number | null) {
    if (this.state.isLoading) {
      return (
        <div className="ResultsMetric__spinner">
          <Spinner animation="border" role="status" aria-label="Loading score" />
        </div>
      );
    }
    return <ScoreIndicator value={value} maxValue={100} stepsColors={this.colors} />;
  }

  renderInfoIcon = (overlay: any, label: string) => (
    <OverlayTrigger trigger="click" rootClose placement="right" overlay={overlay}>
      <span
        className="ResultsMetric__icon"
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        <InfoCircle />
      </span>
    </OverlayTrigger>
  );

  renderTooltipSinglingOut = (props: any) => (
    <Popover {...props} id="singling-out-info-popover">
      <Popover.Body>
        Singling out risk involves identifying rare or unique attributes in
        synthetic data that could potentially reveal specific individuals in the
        original dataset, potentially leading to privacy breaches.
      </Popover.Body>
    </Popover>
  );

  renderTooltipLinkability = (props: any) => (
    <Popover {...props} id="linkability-info-popover">
      <Popover.Body>
        Linkability risk is the concern that, using the synthetic dataset, one
        can determine if two separate sets of attributes belong to the same
        individual in external datasets A and B, assuming that these attributes
        are also found in the synthetic data.
      </Popover.Body>
    </Popover>
  );

  renderTooltipInferrence = (props: any) => (
    <Popover {...props} id="inference-info-popover">
      <Popover.Body>
        Inference risk pertains to the ability of an attacker, who knows the
        values of certain attributes for specific target records, to accurately
        deduce secret attributes of those targets using the synthetic dataset.
      </Popover.Body>
    </Popover>
  );

  renderTooltipCitation = (props: any) => (
    <Popover {...props} id="privacy-citation-popover">
      <Popover.Body>
        Displayed metrics are based on: Giomi, Matteo, et al. "A Unified
        Framework for Quantifying Privacy Risk in Synthetic Data." <i>arXiv</i>{" "}
        preprint <a href="https://arxiv.org/abs/2211.10459">arXiv:2211.10459</a>{" "}
        (2022).
      </Popover.Body>
    </Popover>
  );

  render() {
    return (
      <section className="card ResultsSection PrivacyReport">
        <div className="ResultsSection__header">
          <h2 className="ResultsSection__title">Privacy Evaluation</h2>
          <OverlayTrigger
            trigger="click"
            rootClose
            placement="right"
            overlay={this.renderTooltipCitation}
          >
            <span
              className="ResultsSection__info"
              role="button"
              tabIndex={0}
              aria-label="Citation"
            >
              <InfoCircle />
            </span>
          </OverlayTrigger>
        </div>
        {this.state.error && <Alert variant="warning">{this.state.error}</Alert>}
        <Container fluid className="p-0">
          <Row className="g-4">
            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(
                  ScoreUtils.displayPrivacyScore(this.state.singling_out_risk)
                )}
                <div className="ResultsMetric__label">
                  <h4>Singling Out Risk</h4>
                  {this.renderInfoIcon(this.renderTooltipSinglingOut, "More info")}
                </div>
              </div>
            </Col>

            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(
                  ScoreUtils.displayPrivacyScore(this.state.linkability_risk)
                )}
                <div className="ResultsMetric__label">
                  <h4>Linkability Risk</h4>
                  {this.renderInfoIcon(this.renderTooltipLinkability, "More info")}
                </div>
              </div>
            </Col>

            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(
                  ScoreUtils.displayPrivacyScore(this.state.inference_risk)
                )}
                <div className="ResultsMetric__label">
                  <h4>Inferrence Risk</h4>
                  {this.renderInfoIcon(this.renderTooltipInferrence, "More info")}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }
}

export default PrivacyReport;
