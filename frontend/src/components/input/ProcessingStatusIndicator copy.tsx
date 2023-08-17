import React from "react";
import axios from "axios";
import { Alert, LinearProgress } from "@mui/material";

type State = {
  triggerSuccess: Boolean;
  processingActive: Boolean;
  triggerFailure: Boolean;
  uploadResponseMessage: String;
};

type Props = {
  resource: string;
};

class ProcessingStatusIndicator extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      triggerSuccess: false,
      processingActive: false,
      triggerFailure: false,
      uploadResponseMessage: "",
    };
    this.triggerBackendProcessing();
  }

  triggerBackendProcessing = () => {
    // reset response message state
    this.setState({
      triggerSuccess: false,
      triggerFailure: false,
      processingActive: true,
      uploadResponseMessage: "",
    });
    let responseMessage;
    axios
      .patch(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/default/${this.props.resource}`
      )
      .then((response) => {
        responseMessage = `Status ${response.status}: ${response.data.message}`;
        this.setState({
          triggerSuccess: true,
          processingActive: false,
          uploadResponseMessage: responseMessage,
        });
      })
      .catch((error) => {
        responseMessage = `Status ${error.response.status}: ${error.response.data.detail}`;
        this.setState({
          triggerFailure: true,
          processingActive: false,
          uploadResponseMessage: responseMessage,
        });
      });
  };

  renderTriggerResponse = () => {
    const processLabel = this.props.resource.replace("/", " > ").replaceAll("_", " ");
    if (this.state.triggerSuccess) {
      return (
        <Alert severity="success">
          <b>{processLabel} </b> computation successful!
        </Alert>
      );
    } else if (this.state.triggerFailure) {
      return <Alert severity="error">{this.state.uploadResponseMessage}</Alert>;
    } else if (this.state.processingActive) {
      return <Alert severity="warning">Waiting for API response.</Alert>;
    } else {
      return (
        <Alert severity="warning">
          <b>{processLabel} </b> computing.. <LinearProgress />
        </Alert>
      );
    }
  };

  render() {
    return this.renderTriggerResponse();
  }
}

export default ProcessingStatusIndicator;
