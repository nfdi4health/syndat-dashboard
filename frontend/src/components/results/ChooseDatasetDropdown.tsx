import React from "react";
import axios from "axios";
import { Col, Row } from "react-bootstrap";
import { Autocomplete, TextField } from "@mui/material";

type Props = {
  handler: (dataset: string | null) => any;
};

type State = {
  selectedOption: string;
  availableDatasets: string[];
};

class ChooseDatasetDropdown extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      selectedOption: "default",
      availableDatasets: ["default"],
    };
    this.getAvailableDatasets();
  }

  getAvailableDatasets() {
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/datasets`)
      .then((response) => response.data)
      .then((data) => {
        this.setState({ availableDatasets: data });
      });
  }

  handleDropdownChange = (value: string | null) => {
    if (value === null) {
        return;
    }
    this.setState({ selectedOption: value });
  };

  mapToSelectFormat(initial: string[]) {
    var mapped = initial.map((x: any) => {
      return { value: x, label: x };
    });
    return mapped;
  }

  render() {
    return (
      <Row className="g-2">
        <Col>
          <Autocomplete
            disablePortal
            id="dataset-selector"
            options={this.state.availableDatasets}
            sx={{ width: "100%", maxWidth: 360 }}
            renderInput={(params) => <TextField {...params} label="Dataset" />}
            onChange={(event, value) => this.props.handler(value)}
          />
        </Col>
      </Row>
    );
  }
}

export default ChooseDatasetDropdown;
