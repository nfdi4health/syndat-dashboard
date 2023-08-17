import React from "react";
import axios from "axios";
import { Col, Container, Row } from "react-bootstrap";
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
      <Container>
        <Row>
          <Col>
            <Autocomplete
              disablePortal
              id="combo-box-demo"
              options={this.state.availableDatasets}
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField {...params} label="Dataset" />
              )}
              onChange={(event, value) => this.props.handler(value)}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ChooseDatasetDropdown;
