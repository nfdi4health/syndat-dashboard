import axios from "axios";
import { Switch } from "@mui/material";
import * as React from "react";
import { Alert, Spinner } from "react-bootstrap";
import Plot from "react-plotly.js";

type CoordinateList = {
  x: [];
  y: [];
};

type PatientTraces = {
  trace_real: CoordinateList;
  trace_virtual: CoordinateList;
};

type State = {
  patient_coordinates: PatientTraces;
  outlierScores: Array<number>;
  plotData: any;
  plotLayout: PlotLayout;
  removedIndices: Array<number>;
  selectedIndex: number;
  showAnomalyScore: Boolean;
  isLoading: boolean;
  error: string | null;
};

type Props = {
  dataset: string;
};

type PlotLayout = {
  width: number;
  height: number;
  shapes: Array<LayoutShape>;
  title: String;
};

type LayoutShape = {
  type: String;
  xref: String;
  yref: String;
  x0: Array<number>;
  y0: Array<number>;
  x1: Array<number>;
  y1: Array<number>;
};

class OutlierPlot extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      plotData: [{ x: [], y: [], mode: "markers", type: "scatter" }],
      plotLayout: {
        width: 800,
        height: 800,
        shapes: [
          {
            type: "circle",
            xref: "x",
            yref: "y",
            x0: [],
            y0: [],
            x1: [],
            y1: [],
          },
        ],
        title: "Real vs virtual patient data distribution",
      },
      patient_coordinates: {
        trace_real: { x: [], y: [] },
        trace_virtual: { x: [], y: [] },
      },
      outlierScores: [],
      removedIndices: [],
      selectedIndex: -1,
      // HACK: somehow setting this to true fixes the switch, FIXME if you can
      showAnomalyScore: true,
      isLoading: true,
      error: null,
    };
    this.handleDataPointClick = this.handleDataPointClick.bind(this);
    this.removeCurrentDataPoint = this.removeCurrentDataPoint.bind(this);
  }

  componentDidMount() {
    this.loadData();
  }

  // update plots if props (-> dataset) changes
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.dataset !== this.props.dataset) {
      this.loadData();
    }
  }

  loadData = () => {
    this.setState({ isLoading: true, error: null });

    Promise.all([
      axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/outliers`,
        { params: { anomaly_score: true } }
      ),
      axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/tsne`
      ),
    ])
      .then(([outliersRes, tsneRes]) => {
        const outlierScores = outliersRes.data?.Outlier_Scores ?? [];
        const patient_coordinates = tsneRes.data;

        this.setState(
          {
            outlierScores,
            patient_coordinates,
            removedIndices: [],
            selectedIndex: -1,
            isLoading: false,
            error: null,
          },
          () => {
            this.initializeTraces();
            this.upscaleOutlierScores();
          }
        );
      })
      .catch((error) => {
        this.setState({
          isLoading: false,
          error:
            error?.message === "Network Error"
              ? "Failed to load outlier plot data. API may be unavailable."
              : error?.message || "Failed to load outlier plot data.",
        });
      });
  };

  upscaleOutlierScores() {
    const scores = this.state.outlierScores;
    var scoresScaled = scores.map((score) => score * 100);
    this.setState({ outlierScores: scoresScaled });
  }

  normalizeOutlierScores() {
    // map to a range of 1-100
    var scores = this.state.outlierScores;
    var scoresNormalized = scores.map((score) => score * 100);
    this.setState({ outlierScores: scoresNormalized });
  }

  initializeTraces() {
    var patient_coordinates = this.state.patient_coordinates;
    var trace1 = {
      x: patient_coordinates.trace_real.x,
      y: patient_coordinates.trace_real.y,
      mode: "markers",
      type: "scatter",
      name: "real",
    };
    var trace2 = {
      x: patient_coordinates.trace_virtual.x,
      y: patient_coordinates.trace_virtual.y,
      mode: "markers",
      type: "scatter",
      name: "virtual",
    };
    this.setState({ plotData: [trace1, trace2] });
  }

  updateTraces() {
    var patient_coordinates = this.state.patient_coordinates;
    if (!this.state.showAnomalyScore) {
      // show real and virtual patient tarces, update when point is removed
      var trace1 = {
        x: patient_coordinates.trace_real.x,
        y: patient_coordinates.trace_real.y,
        mode: "markers",
        type: "scatter",
        name: "real",
      };
      var trace2 = {
        x: patient_coordinates.trace_virtual.x,
        y: patient_coordinates.trace_virtual.y,
        mode: "markers",
        type: "scatter",
        name: "virtual",
        marker: { showscale: false },
      };
      if (this.state.removedIndices.length > 0) {
        var toRemove = new Set(this.state.removedIndices);
        trace2.x.filter((x) => !toRemove.has(x));
        trace2.y.filter((y) => !toRemove.has(y));
      }
      this.setState({ plotData: [trace1, trace2] });
    } else {
      // use anomaly score instead
      var trace3 = {
        x: [],
        y: [],
        mode: "markers",
        type: "scatter",
        name: "real",
      };
      var trace4 = {
        x: patient_coordinates.trace_virtual.x,
        y: patient_coordinates.trace_virtual.y,
        mode: "markers",
        type: "scatter",
        name: "virtual",
        marker: { color: this.state.outlierScores, showscale: true },
      };
      this.setState({ plotData: [trace3, trace4] });
    }
  }

  handleDataPointClick(data_point: any) {
    var index = data_point.points[0].pointIndex;
    // virtual patient, calculate virtual index
    if (data_point.points[0].data.name === "virtual") {
      this.setState({ selectedIndex: index });
    } else {
      // real patient, ignore
      this.setState({ selectedIndex: -1 });
    }
  }

  handleDisplaySwitchClick() {
    this.setState({ showAnomalyScore: !this.state.showAnomalyScore });
    this.updateTraces();
  }

  removeCurrentDataPoint() {
    var index = this.state.selectedIndex;
    // check if patient is real
    if (this.state.selectedIndex !== -1) {
      var removedIndicesNew = this.state.removedIndices;
      removedIndicesNew.push(index);
      // dont take in duplikates
      this.setState({ removedIndices: Array.from(new Set(removedIndicesNew)) });
      this.updateTraces();
    }
  }

  render() {
    return (
      <section className="card ResultsSection">
        <div className="OutlierPlot__header">
          <h2 className="ResultsSection__title">Inspect Outliers</h2>
          <div className="OutlierPlot__switch">
            <span className="muted">patient distributions</span>
            <Switch onClick={this.handleDisplaySwitchClick.bind(this)} />
            <span className="muted">outlier scores</span>
          </div>
        </div>

        {this.state.isLoading && <Spinner animation="border" role="status" />}
        {this.state.error && <Alert variant="warning">{this.state.error}</Alert>}

        {!this.state.isLoading && !this.state.error && (
          <div className="ResultsPlotFrame">
            <Plot
              data={this.state.plotData}
              layout={{
                autosize: true,
                title: "Real vs virtual patient data distribution",
                margin: { l: 40, r: 20, t: 50, b: 40 },
              } as any}
              config={{ responsive: true, displayModeBar: false } as any}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
              onClick={this.handleDataPointClick}
            />
          </div>
        )}
      </section>
    );
  }
}

export default OutlierPlot;
