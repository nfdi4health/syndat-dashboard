import axios from "axios";
import React from "react";
import { Col, Container, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";
import ScoreIndicator from "../shared/ScoreIndicator";
import ScoreUtils from "../../utils/ScoreUtils";
import "./ClassifierReport.css";

type ReportProps = {
  dataset: string;
};

type ReportState = {
  auc: number;
  jsd: number;
  norm: number;
};

class ClassifierReport extends React.Component<ReportProps, ReportState> {
  constructor(props: any) {
    super(props);
    this.state = {
      auc: 1,
      jsd: 1,
      norm: 1,
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
      .get(`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/auc`)
      .then((response) => {
        this.setState({ auc: response.data.auc_score });
      })
      .catch((error) => {
        console.log(error);
      });
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/jsd`)
      .then((response) => {
        this.setState({ jsd: response.data.jsd_score });
      })
      .catch((error) => {
        console.log(error);
      });
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/norm`)
      .then((response) => {
        this.setState({
          norm: response.data.norm,
        });
      });
  };

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
        <Container fluid className="p-0">
          <Row className="g-4">
            <Col md={4}>
              <div className="ResultsMetric">
                <ScoreIndicator
                  value={ScoreUtils.calculateAucScore(this.state.auc)}
                  maxValue={100}
                />
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
                <ScoreIndicator
                  value={ScoreUtils.calculateJsdScore(this.state.jsd)}
                  maxValue={100}
                />
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
                <ScoreIndicator
                  value={ScoreUtils.calculateNormScore(this.state.norm)}
                  maxValue={100}
                />
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
