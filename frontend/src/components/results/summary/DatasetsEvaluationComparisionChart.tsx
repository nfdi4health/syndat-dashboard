import React from "react";
import Plot from "react-plotly.js";

type Props = {
    datasets: string[];
    metric1: number[];
    metric2: number[];
    metric3: number[];
    metric1Label: string;
    metric2Label: string;
    metric3Label: string;
    plotTitle: string
};

class DatasetsEvaluationComparisionChart extends React.Component<Props, {}> {
  render() {
    return (
      <div className="ResultsPlotFrame ResultsPlotFrame--summary">
        <Plot
          data={[
            {
              x: this.props.datasets,
              y: this.props.metric1,
              text: this.props.metric1.map((element) => element.toString()),
              type: "bar",
              name: this.props.metric1Label,
            },
            {
              x: this.props.datasets,
              y: this.props.metric2,
              text: this.props.metric2.map((element) => element.toString()),
              type: "bar",
              name: this.props.metric2Label,
            },
            {
              x: this.props.datasets,
              y: this.props.metric3,
              text: this.props.metric3.map((element) => element.toString()),
              type: "bar",
              name: this.props.metric3Label,
            },
          ]}
          layout={{
            autosize: true,
            barmode: "group",
            title: this.props.plotTitle,
            margin: { l: 40, r: 20, t: 50, b: 60 },
            legend: { orientation: "h" },
          } as any}
          config={{ responsive: true, displayModeBar: false } as any}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler
        />
      </div>
    );
  }
}

export default DatasetsEvaluationComparisionChart;
