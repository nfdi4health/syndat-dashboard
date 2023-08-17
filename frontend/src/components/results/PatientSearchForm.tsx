import axios from "axios";
import Button from "@restart/ui/esm/Button";
import React from "react";
import PatientSearchFormEntry from "./PatientSearchFormEntry";
import { Container } from "react-bootstrap";
import VirtualPatient from "./VirtualPatient";
import { Alert } from "@mui/material";

type ColumnTypeData = {
  name: string;
  datatype: string;
  options: Array<String>;
  minval: number;
  maxval: number;
};

type ColumnConstraint = {
  name: string;
  category?: string;
  minval?: number;
  maxval?: number;
};

type State = {
  success: Boolean;
  errorResponse: String;
  columns: Array<ColumnTypeData>;
  submitted: Boolean;
  constraints: Array<ColumnConstraint>;
  searchResult: any;
};

type Props = {
  dataset: string;
};

class PatientSearchForm extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      success: false,
      errorResponse: "",
      columns: [],
      submitted: false,
      constraints: [],
      searchResult: [],
    };
    this.getColumnTypeData();
    this.formUpdateHandler.bind(this);
  }

  // update plots if props (-> dataset) changes
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.dataset !== this.props.dataset) {
      this.getColumnTypeData();
    }
  }

  switchSubmissionStatus = () => {
    if (!this.state.submitted) {
      this.setState({ submitted: !this.state.submitted });
    }
    this.getFilteredPatientList(this.state.constraints);
  };

  getColumnTypeData() {
    axios
      .get(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/patients/synthetic`
      )
      .then((response) => response.data)
      .then((data) => {
        this.setState({ columns: data });
      });
  }

  getFilteredPatientList = (constraints: ColumnConstraint[]) => {
    var payload = {
      constraints: constraints,
    };
    axios
      .post(
        `${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/patients/synthetic/search`,
        payload
      )
      .then((response) => response.data)
      .then((data) => {
        this.setState({ searchResult: data, success: true });
      })
      .catch((error) => {
        this.setState({
          errorResponse: `Status ${error.response.status}: Internal Server error, this component may not be functional at the moment. `,
        });
      });
  };

  formUpdateHandler = (constraintToAdd: ColumnConstraint) => {
    const existingConstraints = this.state.constraints;
    // check wether constraint already exists
    const existingColumns = existingConstraints.map((constr) => constr.name);
    if (existingColumns.includes(constraintToAdd.name)) {
      // yes => replace it
      this.setState({
        constraints: this.state.constraints
          .filter(function (x) {
            return x.name !== constraintToAdd.name;
          })
          .concat([constraintToAdd]),
      });
    } else {
      // no => safe to add it
      this.setState({
        constraints: this.state.constraints.concat([constraintToAdd]),
      });
    }
  };

  renderResponse = () => {
    if (this.state.success) {
      return (
        <div className="result">
          <h2>Results:</h2>
          {this.state.searchResult.map(
            (patient: { [s: string]: String } | ArrayLike<String>) => (
              <VirtualPatient
                id={this.state.searchResult.indexOf(patient)}
                fields={Object.keys(patient)}
                data={Object.values(patient)}
                hide={false}
              />
            )
          )}
        </div>
      );
    } else {
      return <Alert severity="error">{this.state.errorResponse}</Alert>;
    }
  };

  render() {
    return (
      <div>
        <h2>Find Patients like me:</h2>
        <Container>
          {this.state.columns.map((column) => (
            <PatientSearchFormEntry
              handler={this.formUpdateHandler}
              name={column.name}
              datatype={column.datatype}
              options={column.options}
              minval={column.minval}
              maxval={column.maxval}
            />
          ))}
          <Button onClick={this.switchSubmissionStatus}>Submit</Button>
          <div className="result">
            {this.state.submitted && this.renderResponse()}
          </div>
        </Container>
      </div>
    );
  }
}

export default PatientSearchForm;
