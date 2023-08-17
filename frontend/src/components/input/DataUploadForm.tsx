import React from "react";
import axios from "axios";
import { Container } from "react-bootstrap";
import { Alert } from "@mui/material";
import { DataType } from "../../enums/DataType";

type State = {
  selectedFile: any;
  uploadSuccess: Boolean;
  uploadFailure: Boolean;
  uploadResponseMessage: String;
};

type Props = {
  dataType: DataType;
};

class UploadForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedFile: null,
      uploadSuccess: false,
      uploadFailure: false,
      uploadResponseMessage: "",
    };
    this.renderUploadResponse = this.renderUploadResponse.bind(this);
  }

  onFileChange = (event: any) => {
    this.setState({ selectedFile: event.target.files[0] });
  };

  onFileUpload = () => {
    // reset response message state
    this.setState({
      uploadSuccess: false,
      uploadFailure: false,
      uploadResponseMessage: "",
    });
    let responseMessage;
    const formData = new FormData();
    formData.append(
      "file",
      this.state.selectedFile,
      this.state.selectedFile.name
    );
    axios
      .post(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/default/patients/${this.props.dataType}`,
        formData
      )
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
        <div className="uploadForm">
          <input type="file" onChange={this.onFileChange} />
          <button
            onClick={this.onFileUpload}
            disabled={this.state.selectedFile == null}
          >
            Upload
          </button>
        </div>
        <div className="uploadResponse">{this.renderUploadResponse()}</div>
      </Container>
    );
  }
}

export default UploadForm;
