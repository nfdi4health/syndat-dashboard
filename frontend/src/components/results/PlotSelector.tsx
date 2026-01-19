import axios from "axios";
import React from "react";
import Select from "react-select";
import { Alert, Spinner } from "react-bootstrap";

type State = {
  plotList: string[];
  selectedOption: { value: string; label: string } | null;
  availablePlots: { value: string; label: string }[];
  isLoading: boolean;
  error: string | null;
};

type Props = {
  dataset: string;
};

class PlotSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      plotList: [],
      availablePlots: [],
      selectedOption: null,
      isLoading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.getPlotList();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.dataset !== this.props.dataset) {
      this.getPlotList();
    }
  }

  getPlotList() {
    this.setState({ isLoading: true, error: null });

    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/plots/violin`
      )
      .then((response) => {
        const plotList = response.data?.available_columns || [];
        if (plotList.length === 0) {
          throw new Error("No plots available for this dataset.");
        }
        const availablePlots = plotList.map((x: string) => ({
          value: x,
          label: x,
        }));
        this.setState({
          plotList,
          availablePlots,
          selectedOption: availablePlots[0],
          isLoading: false,
        });
      })
      .catch((error) => {
        this.setState({
          error: error.message || "Failed to load plots.",
          isLoading: false,
          plotList: [],
          availablePlots: [],
          selectedOption: null,
        });
      });
  }

  handleDropdownChange = (selectedOption: any) => {
    this.setState({ selectedOption });
  };

  render() {
    const { availablePlots, selectedOption, isLoading, error } = this.state;
    const { dataset } = this.props;

    return (
      <section className="card ResultsSection">
        <h2 className="ResultsSection__title">Inspect Plots</h2>

        {isLoading && <Spinner animation="border" role="status" />}

        {error && <Alert variant="warning">{error}</Alert>}

        {!isLoading && !error && availablePlots.length > 0 && (
          <>
            <Select
              options={availablePlots}
              onChange={this.handleDropdownChange}
              value={selectedOption}
            />
            {selectedOption && (
              <img
                className="ResultsPlotImage"
                src={`${process.env.REACT_APP_API_BASE_URL}/datasets/${dataset}/plots/violin/${selectedOption.value}`}
                alt={`Plot for ${selectedOption.label}`}
              />
            )}
          </>
        )}
      </section>
    );
  }
}

export default PlotSelector;
