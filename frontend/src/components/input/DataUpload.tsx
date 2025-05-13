import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import UploadForm from "./DataUploadForm";
import "./DataUpload.css";
import LastChangedBadge from "./LastChangedBadge";
import DatasetStoragePrompt from "./DatasetStoragePrompt";
import { DataType } from "../../enums/DataType";
import { Card } from "@mui/material";
import ProcessingPanel from "./ProcessingPanel";

class OutputUpload extends React.Component {
  render() {
    return (
      <div className="InputPage">
        <Container>
          <h1> Data Upload & Processing</h1>
          <p>
            You can directly upload patient data that has been generated and
            processed by VAMBN or any similar generative approach and trigger a
            recomputation of the output metrices and plots. Please note the
            following formatting guidelines:
            <ol>
              <li>
                Your files should be in the csv format. Other file formats are
                not accepted and will yield an error response.
              </li>
              <li>
                Both real and synthetic data should have the same column names
                to make them comparable.
              </li>
            </ol>
          </p>
          <p>
            Please also note the following specifics regarding <i>missing</i>{" "}
            data:
            <ol>
              <li>
                Data rows containing missing values will not be considered for
                the results computation. This may result in an unbalanced
                classification when a lot of data points are missing.
              </li>
              <li>
                Data points containing missing data will also be omitted from 2D
                plot.
              </li>
              <li>
                For the distribution plots, missing data will be omitted for
                numerical data columns. For categorical columns, they will be
                listed in the bar-charts as either NaN or the specified encoded
                value.
              </li>
            </ol>
          </p>
          <p>
            You can upload the required files using the form below. Hitting the
            "process" button after successfull file upload will trigger the
            result processing in the backend. The results will be displayed on
            the Results Page as soon as the processing is finished. This will
            overwrite the current result set with the name "default", which is
            by default rendered when visiting the result page.
          </p>
        </Container>
        <Card variant="outlined">
          {" "}
          <Container>
            <Row className="uploadRow">
              <h2>Data Upload</h2>
              <Col className="uploadColumn">
                <h3>Real Data</h3>
                <UploadForm dataType={DataType.real} />
                <LastChangedBadge resource={"patients/real/last-update"} />
              </Col>
              <Col className="uploadColumn">
                <h3>Synthetic Data</h3>
                <UploadForm dataType={DataType.synthetic} />
                <LastChangedBadge resource={"patients/synthetic/last-update"} />
              </Col>
            </Row>
          </Container>
        </Card>
        <Container>
          <Card variant="outlined" className="sectionCard">
            <h2>Backend result re-processing</h2>
            <ProcessingPanel />
            <LastChangedBadge resource={"results/last-update"} />
          </Card>
        </Container>

        <Container>
          <Card variant="outlined" className="sectionCard">
            <h2>Store Results</h2>
            <p>
              You may store the current processed results using a String
              identifier. Previously stored results can be selected using the
              dataset dropdown on the top of the results page:
            </p>
            <Row>
              <Col>
                <DatasetStoragePrompt />
              </Col>
              <Col />
            </Row>
          </Card>
        </Container>
      </div>
    );
  }
}

export default OutputUpload;
