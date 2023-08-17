import React from "react";
import Plot from "react-plotly.js";

type Props = {
    datasets: string[];
    auc: number[];
    jsd: number[];
    norm: number[];
};

class DatasetsEvaluationComparisionChart extends React.Component<Props, {}> {
  render() {
    return (
      <Plot
        data={[
          {
            x: this.props.datasets,
            y: this.props.auc,
            text: this.props.auc.map(element => element.toString()),
            type: "bar",
            name: "ROC Area Under Curve Score",
          },
          {
            x: this.props.datasets,
            y: this.props.jsd,
            text: this.props.jsd.map(element => element.toString()),
            type: "bar",
            name: "Jensen-Shannon Divergence Score",
          },
          {
            x: this.props.datasets,
            y: this.props.norm,
            text: this.props.norm.map(element => element.toString()),
            type: "bar",
            name: "Norm Quotient Score",

          }
        ]}
        layout={{ barmode: "group", title: "Dataset Evaluation", width:1200}}
      ></Plot>
    );
  }
}

export default DatasetsEvaluationComparisionChart;
