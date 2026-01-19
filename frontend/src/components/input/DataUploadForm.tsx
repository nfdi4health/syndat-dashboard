import React from "react";
import axios from "axios";
import { Alert } from "@mui/material";
import { DataType } from "../../enums/DataType";
import PostProcessingOptions, {
  PostProcessingOptions as Options,
} from "./PostProcessingOptions";

type State = {
  selectedFile: any;
  uploadSuccess: Boolean;
  uploadFailure: Boolean;
  uploadResponseMessage: String;
  postProcessingOptions: Options;
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
      postProcessingOptions: {
        normalize_scale: false,
        assert_minmax: false,
        normalize_float_precision: false,
      },
    };
  }

  onFileChange = (event: any) => {
    this.setState({ selectedFile: event.target.files[0] });
  };

  onFileUpload = async () => {
    this.setState({
      uploadSuccess: false,
      uploadFailure: false,
      uploadResponseMessage: "",
    });

    const formData = new FormData();
    formData.append("file", this.state.selectedFile, this.state.selectedFile.name);

    try {
      const uploadRes = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/default/patients/${this.props.dataType}`,
        formData
      );

      let message = `Upload successful: ${uploadRes.status} ${uploadRes.data.message}`;

      // Apply postprocessing if synthetic data and options selected
      if (this.props.dataType === DataType.synthetic) {
        const { normalize_scale, assert_minmax, normalize_float_precision } = this.state.postProcessingOptions;
        if (normalize_scale || assert_minmax || normalize_float_precision) {
          const postprocessRes = await axios.patch(
            `${process.env.REACT_APP_API_BASE_URL}/datasets/default/patients/synthetic/postprocessing`,
            {},
            {
              params: {
                normalize_scale,
                assert_minmax,
                normalize_float_precision,
              },
            }
          );
          message += ` | Post-processing: ${postprocessRes.status} ${postprocessRes.data.message}`;
        }
      }

      this.setState({
        uploadSuccess: true,
        uploadResponseMessage: message,
      });
    } catch (error: any) {
      const status = error?.response?.status ?? "Unknown";
      const detail = error?.response?.data?.detail ?? error?.message ?? "Unknown error";
      this.setState({
        uploadFailure: true,
        uploadResponseMessage: `Status ${status}: ${detail}`,
      });
    }
  };

  handlePostProcessingChange = (updated: Options) => {
    this.setState({ postProcessingOptions: updated });
  };

  renderUploadResponse = () => {
    if (this.state.uploadSuccess) {
      return <Alert severity="success">{this.state.uploadResponseMessage}</Alert>;
    } else if (this.state.uploadFailure) {
      return <Alert severity="error">{this.state.uploadResponseMessage}</Alert>;
    } else {
      return <Alert severity="info">Waiting for upload.</Alert>;
    }
  };

  render() {
    return (
      <div className="UploadFormRoot">
        <div className="UploadFormRoot__body uploadForm">
          <input type="file" onChange={this.onFileChange} />

          {this.props.dataType === DataType.synthetic && (
            <div style={{ marginTop: "1rem" }}>
              <h5>Postprocessing Options</h5>
              <PostProcessingOptions
                options={this.state.postProcessingOptions}
                onChange={this.handlePostProcessingChange}
              />
            </div>
          )}

          <button onClick={this.onFileUpload} disabled={!this.state.selectedFile}>
            Upload
          </button>
        </div>

        <div className="UploadFormRoot__status uploadResponse">
          {this.renderUploadResponse()}
        </div>
      </div>
    );
  }
}

export default UploadForm;
