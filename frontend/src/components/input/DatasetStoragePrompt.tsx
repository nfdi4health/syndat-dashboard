import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import "./DataUpload.css";
import { Alert, Button, TextField } from "@mui/material";
import axios from "axios";

type State = {
  textBoxValue: string;
  uploadSuccess: boolean;
  uploadFailure: boolean;
  uploadResponseMessage: string;
};

class DatasetStoragePrompt extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      textBoxValue: "",
      uploadSuccess: false,
      uploadFailure: false,
      uploadResponseMessage: "",
    };
  }

  handleTextInput = (event: any) => {
    this.setState({ textBoxValue: event.target.value });
    console.log(this.state.textBoxValue);
  };

  submitDatasetToStorage = () => {
    // reset response message state
    this.setState({
      uploadSuccess: false,
      uploadFailure: false,
      uploadResponseMessage: "",
    });
    let responseMessage;
    axios
      .put(`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.state.textBoxValue}`)
      .then((response) => {
        responseMessage = `Status ${response.status}: ${response.data.message}`;
        this.setState({
          uploadSuccess: true,
          uploadResponseMessage: responseMessage,
        });
      })
      .catch((error) => {
        responseMessage = `Status ${error.response.status}: ${error.response.data.detail}`;
        this.setState({
          uploadFailure: true,
          uploadResponseMessage: responseMessage,
        });
      });
  };

  renderUploadResponse = () => {
    console.log(this.state.uploadResponseMessage);
    if (this.state.uploadSuccess) {
      return (
        <Alert severity="success">{this.state.uploadResponseMessage}</Alert>
      );
    } else if (this.state.uploadFailure) {
      return <Alert severity="error">{this.state.uploadResponseMessage}</Alert>;
    } else {
      return <Alert severity="info">Waiting for upload.</Alert>;
    }
  };

  render() {
    return (
      <Container>
        <Row>
          <Col>
            <TextField
              id="outlined-basic"
              label="Dataset Name"
              variant="outlined"
              onChange={this.handleTextInput}
            />
          </Col>
          <Col className="button-col">
            <button onClick={this.submitDatasetToStorage}>
              Store current Results
            </button>
          </Col>
        </Row>
        <div className="uploadResponse">{this.renderUploadResponse()}</div>
      </Container>
    );
  }
}

export default DatasetStoragePrompt;
