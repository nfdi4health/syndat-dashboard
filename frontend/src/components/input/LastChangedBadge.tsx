import axios from "axios";
import React from "react";
import { Badge } from "react-bootstrap";

type State = {
  date: number;
  dateParsed: string;
};

type Props = {
  resource: string;
};

class LastChangedBadge extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      date: 0,
      dateParsed: "UNKNOWN",
    };
  }

  componentDidMount() {
    this.updateLastChangedDate();
  }

  updateLastChangedDate = () => {
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/datasets/default/${this.props.resource}`)
      .then((response) => {
        const timestamp = response.data;
        const dateParsed = new Date(timestamp * 1000).toLocaleString();
        this.setState({ date: timestamp, dateParsed });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return <Badge bg="info">Last Changed: {this.state.dateParsed}</Badge>;
  }
}

export default LastChangedBadge;
