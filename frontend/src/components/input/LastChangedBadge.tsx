import axios from "axios";
import React from "react";
import { Badge } from "react-bootstrap";

type State =
 {
    date: number;
    dateParsed: String;
 }

 type Props = {
    resource: String;
 }

class LastChangedBadge extends React.Component<Props, State> {

    constructor(props: any) {
        super(props);
        this.state = {
          date: 0,
          dateParsed: "UNKNOWN"
        };
        this.updateLastChangedDate();
      }

    updateLastChangedDate = () => {
        axios.get(`${process.env.REACT_APP_API_BASE_URL}/datasets/default/${this.props.resource}`)  
        .then((response) => {
          this.setState({date:response.data})
          this.parseDate()
        })
        .catch((error) => {
            console.log(error)
        });
    }

    parseDate = () => {
      if (this.state.date !== 0) {
        console.log(this.state.date)
        // python result in in seconds, javascript calculated in ms
        const date = new Date(this.state.date * 1000)
        this.setState({dateParsed: date.toLocaleString()})
      }
    }

    render() {
        return <Badge bg="info">Last Changed: {this.state.dateParsed}</Badge>
    }

}

export default LastChangedBadge;
