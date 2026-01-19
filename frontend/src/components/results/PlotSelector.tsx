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

  getSelectedIndex(): number {
    const { plotList, selectedOption } = this.state;
    if (!selectedOption) return -1;
    return plotList.indexOf(selectedOption.value);
  }

  goToPlotByOffset(offset: number) {
    const { plotList, availablePlots } = this.state;
    const currentIndex = this.getSelectedIndex();
    if (plotList.length === 0 || currentIndex < 0) return;

    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= plotList.length) return;

    this.setState({ selectedOption: availablePlots[nextIndex] ?? null });
  }

  render() {
    const { availablePlots, selectedOption, isLoading, error } = this.state;
    const { dataset } = this.props;

    const selectedIndex = this.getSelectedIndex();
    const hasPrev = selectedIndex > 0;
    const hasNext = selectedIndex >= 0 && selectedIndex < this.state.plotList.length - 1;

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
              <div className="InspectPlotsGallery">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => this.goToPlotByOffset(-1)}
                    disabled={!hasPrev}
                    aria-label="Previous plot"
                  >
                    ←
                  </button>

                  <img
                    className="ResultsPlotImage"
                    src={`${process.env.REACT_APP_API_BASE_URL}/datasets/${dataset}/plots/violin/${selectedOption.value}`}
                    alt={`Plot for ${selectedOption.label}`}
                  />

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => this.goToPlotByOffset(1)}
                    disabled={!hasNext}
                    aria-label="Next plot"
                  >
                    →
                  </button>
              </div>
            )}
          </>
        )}
      </section>
    );
  }
}

export default PlotSelector;
