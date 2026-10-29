import React from "react";
import axios from "axios";
import { Alert, LinearProgress } from "@mui/material";
import MessageUtils from "../../utils/MessageUtils";

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
  }

  componentDidMount() {
    this.triggerBackendProcessing();
  }

  processLabel = () =>
    this.props.resource.replace("/", " > ").replaceAll("_", " ");

  triggerBackendProcessing = () => {
    this.setState({
      triggerSuccess: false,
      triggerFailure: false,
      processingActive: true,
      uploadResponseMessage: "",
    });

    axios
      .patch(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/default/${this.props.resource}`
      )
      .then((response) => {
        this.setState({
          triggerSuccess: true,
          processingActive: false,
          triggerFailure: false,
          uploadResponseMessage: `Status ${response.status}: ${response.data?.message ?? ""}`,
        });
      })
      .catch((error) => {
        this.setState({
          triggerSuccess: false,
          processingActive: false,
          triggerFailure: true,
          uploadResponseMessage: `Processing failed: ${MessageUtils.describeError(error)}`,
        });
      });
  };

  renderTriggerResponse = () => {
    if (this.state.triggerSuccess) {
      return (
        <Alert severity="success">
          <b>{this.processLabel()} </b> computation successful!
        </Alert>
      );
    } else if (this.state.triggerFailure) {
      return <Alert severity="error">{this.state.uploadResponseMessage}</Alert>;
    } else {
      return (
        <Alert severity="warning">
          <b>{this.processLabel()} </b> computing.. <LinearProgress />
        </Alert>
      );
    }
  };

  render() {
    return this.renderTriggerResponse();
  }
}

export default ProcessingStatusIndicator;
