import { Switch } from "@mui/material";
import React from "react";
import { Container } from "react-bootstrap";
import "./CorrelationPlot.css"

type State = {
  checked: boolean;
}

type Props = {
  dataset: string;
}


class CorrelationPlot extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = { checked: false };
    this.handleDisplaySwitchClick = this.handleDisplaySwitchClick.bind(this);
  }

  handleDisplaySwitchClick() {
    this.setState({ checked: !this.state.checked });
  }


  render() {
    var switchState = this.state.checked ? "virtual" : "real"
    return (
      <Container>
        <h2>Correlation Plot:</h2>
        real{" "}
        <Switch onClick={this.handleDisplaySwitchClick.bind(this)}/>
        virtual
        <div>
          <img
            className="small"
            src={`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/plots/correlation?type=${switchState}&t=${Date.now()}`}
            alt="correlation plot"
          />
        </div>
      </Container>
    );
  }
}

export default CorrelationPlot;
