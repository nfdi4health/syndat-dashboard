import axios from "axios";
import { Switch } from "@mui/material";
import * as React from "react";
import Plot from "react-plotly.js";
import PatientSelector from "./PatientSelector";

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
    };
    this.getVirtualOutlierScores();
    this.getPatientsTsneCoordinates();
    this.handleDataPointClick = this.handleDataPointClick.bind(this);
    this.removeCurrentDataPoint = this.removeCurrentDataPoint.bind(this);
  }

  componentDidMount() {
    this.getVirtualOutlierScores();
    this.getPatientsTsneCoordinates();
  }

  // update plots if props (-> dataset) changes
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.dataset !== this.props.dataset) {
      this.getVirtualOutlierScores();
      this.getPatientsTsneCoordinates();
    }
  }

  getVirtualOutlierScores() {
    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/outliers`,
        { params: { anomaly_score: true } }
      )
      .then((response) => response.data)
      .then((data) => {
        this.setState({ outlierScores: data.Outlier_Scores });
      })
      .then(() => this.initializeTraces())
      .then(() => this.upscaleOutlierScores());
  }

  getPatientsTsneCoordinates() {
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/results/tsne`)
      .then((response) => response.data)
      .then((data) => {
        this.setState({ patient_coordinates: data });
      })
      .then(() => this.initializeTraces());
  }

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
      <div>
        <h2>Inspect Outliers:</h2>
        <PatientSelector
          index={this.state.selectedIndex}
          clickHandler={this.removeCurrentDataPoint}
          dataset={this.props.dataset}
        />
        <p>
          Show patient distributions{" "}
          <Switch onClick={this.handleDisplaySwitchClick.bind(this)} /> Show
          Outlier Scores
        </p>
        <Plot
          data={this.state.plotData}
          layout={{
            width: 800,
            height: 800,
            title: "Real vs virtual patient data distribution",
          }}
          onClick={this.handleDataPointClick}
        />
      </div>
    );
  }
}

export default OutlierPlot;
