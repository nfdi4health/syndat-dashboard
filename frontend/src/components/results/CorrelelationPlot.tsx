import { Switch } from "@mui/material";
import React from "react";
import { Alert, Spinner } from "react-bootstrap";
import "./CorrelationPlot.css"

type State = {
  checked: boolean;
  isLoading: boolean;
  error: string | null;
  cacheBuster: number;
}

type Props = {
  dataset: string;
}


class CorrelationPlot extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = { checked: false, isLoading: true, error: null, cacheBuster: Date.now() };
    this.handleDisplaySwitchClick = this.handleDisplaySwitchClick.bind(this);
  }

  handleDisplaySwitchClick() {
    this.setState({
      checked: !this.state.checked,
      isLoading: true,
      error: null,
      cacheBuster: Date.now(),
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.dataset !== this.props.dataset) {
      this.setState({ isLoading: true, error: null, cacheBuster: Date.now() });
    }
  }


  render() {
    var switchState = this.state.checked ? "virtual" : "real"
    return (
      <section className="card ResultsSection CorrelationPlot">
        <div className="CorrelationPlot__header">
          <h2 className="ResultsSection__title">Correlation Plot</h2>
          <div className="CorrelationPlot__switch">
            <span className="muted">real</span>
            <Switch onClick={this.handleDisplaySwitchClick.bind(this)} />
            <span className="muted">synthetic</span>
          </div>
        </div>

        {this.state.isLoading && <Spinner animation="border" role="status" />}
        {this.state.error && <Alert variant="warning">{this.state.error}</Alert>}

        <div>
          {!this.state.error && (
            <img
              className="ResultsPlotImage"
              src={`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/plots/correlation?type=${switchState}&t=${this.state.cacheBuster}`}
              alt="correlation plot"
              onLoad={() => this.setState({ isLoading: false })}
              onError={() =>
                this.setState({
                  isLoading: false,
                  error:
                    "Failed to load correlation plot. API may be unavailable or the plot is missing.",
                })
              }
            />
          )}
        </div>
      </section>
    );
  }
}

export default CorrelationPlot;
