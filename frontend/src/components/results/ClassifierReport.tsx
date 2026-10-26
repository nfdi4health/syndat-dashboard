import axios from "axios";
import React from "react";
import { Alert, Col, Container, OverlayTrigger, Row, Spinner, Tooltip } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";
import ScoreIndicator from "../shared/ScoreIndicator";
import ScoreUtils from "../../utils/ScoreUtils";
import "./ClassifierReport.css";

type ReportProps = {
  dataset: string;
};

type ReportState = {
  auc: number | null;
  jsd: number | null;
  norm: number | null;
  isLoading: boolean;
  error: string | null;
};

class ClassifierReport extends React.Component<ReportProps, ReportState> {
  constructor(props: any) {
    super(props);
    this.state = {
      auc: null,
      jsd: null,
      norm: null,
      isLoading: true,
      error: null,
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
    this.setState({ isLoading: true, error: null });
    const resultsUrl = `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results`;
    Promise.all([
      axios
        .get(`${resultsUrl}/auc`)
        .then((response) => response.data.auc_score)
        .catch(() => null),
      axios
        .get(`${resultsUrl}/jsd`)
        .then((response) => response.data.jsd_score)
        .catch(() => null),
      axios
        .get(`${resultsUrl}/norm`)
        .then((response) => response.data.norm)
        .catch(() => null),
    ]).then(([auc, jsd, norm]) => {
      const allFailed =
        auc === null && jsd === null && norm === null;
      this.setState({
        auc,
        jsd,
        norm,
        isLoading: false,
        error: allFailed
          ? "Failed to load quality scores. The API may be unavailable or the data could not be read."
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
    return <ScoreIndicator value={value} maxValue={100} />;
  }

  renderTooltipAUC = (props: any) => (
    <Tooltip id="button-tooltip" {...props}>
      The computed score is based on the calculated ROC <b>Area Under Curve</b>{" "}
      score of a random forest classifier, which tries to differentiate real
      from synthetic patient data.
    </Tooltip>
  );

  renderTooltipJSD = (props: any) => (
    <Tooltip id="button-tooltip2" {...props}>
      The computed score is based on the calculated{" "}
      <b>Jennson-Shannon Divergence</b> of the two patient distributions.
    </Tooltip>
  );

  renderTooltipFrobeniusNorm = (props: any) => (
    <Tooltip id="button-tooltip2" {...props}>
      The computed score is based on the fraction of the calculated{" "}
      <b>Frobenius Norm</b> of the two patient distributions.
    </Tooltip>
  );

  render() {
    return (
      <section className="card ResultsSection ClassifierReport">
        <div className="ResultsSection__header">
          <h2 className="ResultsSection__title">Quality Evaluation</h2>
        </div>
        {this.state.error && <Alert variant="warning">{this.state.error}</Alert>}
        <Container fluid className="p-0">
          <Row className="g-4">
            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(ScoreUtils.calculateAucScore(this.state.auc))}
                <div className="ResultsMetric__label">
                  <h4>Discrimination Complexity</h4>
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={this.renderTooltipAUC}
                  >
                    <span className="ResultsMetric__icon" aria-label="More info">
                      <InfoCircle />
                    </span>
                  </OverlayTrigger>
                </div>
              </div>
            </Col>

            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(ScoreUtils.calculateJsdScore(this.state.jsd))}
                <div className="ResultsMetric__label">
                  <h4>Distribution Similarity</h4>
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={this.renderTooltipJSD}
                  >
                    <span className="ResultsMetric__icon" aria-label="More info">
                      <InfoCircle />
                    </span>
                  </OverlayTrigger>
                </div>
              </div>
            </Col>

            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(ScoreUtils.calculateNormScore(this.state.norm))}
                <div className="ResultsMetric__label">
                  <h4>Correlation Score</h4>
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={this.renderTooltipFrobeniusNorm}
                  >
                    <span className="ResultsMetric__icon" aria-label="More info">
                      <InfoCircle />
                    </span>
                  </OverlayTrigger>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }
}

export default ClassifierReport;
