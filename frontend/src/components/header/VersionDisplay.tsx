import axios from "axios";
import React from "react";
import { Badge } from "react-bootstrap";

type State = {
  version: String;
};

class VersionDisplay extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      version: "UNKNOWN",
    };
    this.getAPIVersion();
  }

  getAPIVersion = () => {
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/version`)
      .then((response) => {
        this.setState({ version: response.data });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return (
      <a href={process.env.REACT_APP_API_BASE_URL}>
        <Badge bg="secondary">App Version: {this.state.version}</Badge>
      </a>
    );
  }
}

export default VersionDisplay;
