import axios from "axios";
import React from "react";
import Select from "react-select";
import { Container } from "react-bootstrap";

type State = {
  plotList: any;
  selectedOption: any;
  availablePlots: any;
};

type Props = {
  dataset: string;
};

class PlotSelector extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      plotList: [""],
      availablePlots: [{ value: "", label: "" }],
      selectedOption: { value: "", label: "" },
    };
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.getPlotList();
  }

  // update plots if props (-> dataset) changes
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.dataset !== this.props.dataset) {
      this.getPlotList();
    }
  }

  getPlotList() {
    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/plots/violin`
      )
      .then((response) => response.data)
      .then((data) => {
        this.setState({ plotList: data.available_columns });
      })
      .then(() =>
        this.setState({
          selectedOption: {
            value: this.state.plotList,
            label: this.state.plotList,
          },
        })
      )
      .then(() =>
        this.setState({ availablePlots: this.mapPlotList(this.state.plotList) })
      )
      .then(() =>
        this.setState({ selectedOption: this.state.availablePlots[0] })
      );
  }

  mapPlotList(initial: any) {
    var mapped = initial.map((x: any) => {
      return { value: x, label: x };
    });
    return mapped;
  }

  handleDropdownChange = (selectedOption: any) => {
    this.setState({ selectedOption });
  };

  render() {
    return (
      <Container>
        <h2>Inspect Plots: </h2>
        <Select
          options={this.state.availablePlots}
          onChange={this.handleDropdownChange}
        />
        <img
          className="kld-plot"
          src={`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/plots/violin/${this.state.selectedOption.value}`}
          alt={"KLD plot"}
        />
      </Container>
    );
  }
}

export default PlotSelector;
