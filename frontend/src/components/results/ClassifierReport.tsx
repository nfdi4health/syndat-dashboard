import axios from "axios";
import React from "react";
import { Alert, Col, Container, OverlayTrigger, Popover, Row, Spinner } from "react-bootstrap";
import { ExclamationTriangle, InfoCircle } from "react-bootstrap-icons";
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
  realRows: number | null;
  totalRealRows: number | null;
  isLoadingAuc: boolean;
  isLoadingJsd: boolean;
  isLoadingNorm: boolean;
  error: string | null;
};

class ClassifierReport extends React.Component<ReportProps, ReportState> {
  private requestId = 0;

  constructor(props: any) {
    super(props);
    this.state = {
      auc: null,
      jsd: null,
      norm: null,
      realRows: null,
      totalRealRows: null,
      isLoadingAuc: true,
      isLoadingJsd: true,
      isLoadingNorm: true,
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
    const requestId = ++this.requestId;
    this.setState({
      auc: null,
      jsd: null,
      norm: null,
      realRows: null,
      totalRealRows: null,
      isLoadingAuc: true,
      isLoadingJsd: true,
      isLoadingNorm: true,
      error: null,
    });

    const resultsUrl = `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results`;
    const failures = { count: 0 };
    const isStale = () => requestId !== this.requestId;

    const onFailure = () => {
      if (isStale()) return;
      failures.count += 1;
      if (failures.count === 3) {
        this.setState({
          isLoadingAuc: false,
          isLoadingJsd: false,
          isLoadingNorm: false,
          error:
            "Failed to load quality scores. The API may be unavailable or the data could not be read.",
        });
      }
    };

    axios
      .get(`${resultsUrl}/auc`)
      .then((response) => {
        if (isStale()) return;
        this.setState({
          auc: response.data.auc_score,
          realRows: response.data.real_rows ?? null,
          totalRealRows: response.data.total_real_rows ?? null,
          isLoadingAuc: false,
        });
      })
      .catch(onFailure);

    axios
      .get(`${resultsUrl}/jsd`)
      .then((response) => {
        if (isStale()) return;
        this.setState({ jsd: response.data.jsd_score, isLoadingJsd: false });
      })
      .catch(onFailure);

    axios
      .get(`${resultsUrl}/norm`)
      .then((response) => {
        if (isStale()) return;
        this.setState({ norm: response.data.norm, isLoadingNorm: false });
      })
      .catch(onFailure);
  };

  renderScore(value: number | null, isLoading: boolean) {
    if (isLoading) {
      return (
        <div className="ResultsMetric__spinner">
          <Spinner animation="border" role="status" aria-label="Loading score" />
        </div>
      );
    }
    return <ScoreIndicator value={value} maxValue={100} />;
  }

  getMissingDataInfo = () => {
    const { realRows, totalRealRows } = this.state;
    if (
      realRows === null ||
      totalRealRows === null ||
      totalRealRows <= 0
    ) {
      return null;
    }
    const droppedRows = totalRealRows - realRows;
    const missingRatio = droppedRows / totalRealRows;
    if (missingRatio <= 0.2) {
      return null;
    }
    return { droppedRows, totalRealRows };
  };

  renderAucDisclaimer = (props: any) => {
    const missingDataInfo = this.getMissingDataInfo();
    const aucScore = ScoreUtils.calculateAucScore(this.state.auc);
    const lowScore = aucScore !== null && aucScore < 40;
    return (
      <Popover {...props} id="auc-disclaimer-popover">
        <Popover.Body className="ClassifierReport__disclaimer">
          {missingDataInfo && (
            <p>
              For the calculation of the Discrimination Score,{" "}
              <b>
                {missingDataInfo.droppedRows} out of{" "}
                {missingDataInfo.totalRealRows}
              </b>{" "}
              incomplete records had to be dropped from the original dataset.
              With this many records missing, the score may be unrepresentative
              of the full dataset.
            </p>
          )}
          {missingDataInfo && lowScore && <hr />}
          {lowScore && (
            <p>
              This score can be low even when the synthetic data is still
              faithful and useful. A classifier that struggles to tell real and
              synthetic records apart can also mean the two datasets are very
              similar.
            </p>
          )}
        </Popover.Body>
      </Popover>
    );
  };

  renderAucWarning = (aucScore: number | null) => {
    const missingDataInfo = this.getMissingDataInfo();
    const lowScore = aucScore !== null && aucScore < 40;
    if (this.state.isLoadingAuc || (!lowScore && !missingDataInfo)) {
      return null;
    }
    return (
      <OverlayTrigger
        trigger="click"
        rootClose
        placement="right"
        overlay={this.renderAucDisclaimer}
      >
        <span
          className="ResultsMetric__icon ResultsMetric__icon--warning"
          role="button"
          tabIndex={0}
          aria-label="About this score"
        >
          <ExclamationTriangle />
        </span>
      </OverlayTrigger>
    );
  };

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

  renderTooltipAUC = (props: any) => (
    <Popover {...props} id="auc-info-popover">
      <Popover.Body>
        The computed score is based on the calculated ROC <b>Area Under Curve</b>{" "}
        score of a random forest classifier, which tries to differentiate real
        from synthetic patient data.
      </Popover.Body>
    </Popover>
  );

  renderTooltipJSD = (props: any) => (
    <Popover {...props} id="jsd-info-popover">
      <Popover.Body>
        The computed score is based on the calculated{" "}
        <b>Jennson-Shannon Divergence</b> of the two patient distributions.
      </Popover.Body>
    </Popover>
  );

  renderTooltipFrobeniusNorm = (props: any) => (
    <Popover {...props} id="norm-info-popover">
      <Popover.Body>
        The computed score is based on the fraction of the calculated{" "}
        <b>Frobenius Norm</b> of the two patient distributions.
      </Popover.Body>
    </Popover>
  );

  render() {
    const aucScore = ScoreUtils.calculateAucScore(this.state.auc);
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
                {this.renderScore(aucScore, this.state.isLoadingAuc)}
                <div className="ResultsMetric__label">
                  <h4>Discrimination Complexity</h4>
                  {this.renderInfoIcon(this.renderTooltipAUC, "More info")}
                  {this.renderAucWarning(aucScore)}
                </div>
              </div>
            </Col>

            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(
                  ScoreUtils.calculateJsdScore(this.state.jsd),
                  this.state.isLoadingJsd
                )}
                <div className="ResultsMetric__label">
                  <h4>Distribution Similarity</h4>
                  {this.renderInfoIcon(this.renderTooltipJSD, "More info")}
                </div>
              </div>
            </Col>

            <Col md={4}>
              <div className="ResultsMetric">
                {this.renderScore(
                  ScoreUtils.calculateNormScore(this.state.norm),
                  this.state.isLoadingNorm
                )}
                <div className="ResultsMetric__label">
                  <h4>Correlation Score</h4>
                  {this.renderInfoIcon(this.renderTooltipFrobeniusNorm, "More info")}
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
