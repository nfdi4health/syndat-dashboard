import axios from "axios";
import Button from "@restart/ui/esm/Button";
import React from "react";
import { Badge, Container } from "react-bootstrap";
import "./PatientSelector.css";
import VirtualPatient from "./VirtualPatient";

type Props = {
  index: number;
  dataset: string;
  clickHandler: () => any;
};

type State = {
  showPatient: Boolean;
  keys: Array<String>;
  values: Array<String>;
};

class PatientSelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showPatient: false,
      keys: [],
      values: [],
    };
    this.showPatient.bind(this);
    this.getVirtualPatientData(this.props.index);
  }

  showPatient = () => {
    this.getVirtualPatientData(this.props.index);
    this.setState({ showPatient: true });
  };

  getVirtualPatientData(index: number) {
    if (index >= 0) {
      axios
        .get(`${process.env.REACT_APP_API_BASE_URL}/datasets/${this.props.dataset}/patients/synthetic/${index}`)
        .then((response) => response.data)
        .then((data) => {
          // FIXME: this sometimes does not set the state correctly
          this.setState({
            keys: Object.keys(data),
            values: Object.values(data),
          });
        });
    }
  }

  render() {
    return (
      <Container>
        {(() => {
          if (this.props.index !== -1) {
            return (
              <div>
                <Badge bg="primary">Virtual Patient {this.props.index}</Badge>
                <Button onClick={this.showPatient}>Inspect</Button>
                {this.state.showPatient && (
                  <VirtualPatient
                    id={this.props.index}
                    fields={this.state.keys}
                    data={this.state.values}
                    hide={!this.state.showPatient}
                  />
                )}
              </div>
            );
          } else {
            return <Badge bg="secondary">Currently no virtual data point selected</Badge>;
          }
        })()}
      </Container>
    );
  }
}

export default PatientSelector;
