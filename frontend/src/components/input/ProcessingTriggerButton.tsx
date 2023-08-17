import React from "react";
import axios from 'axios';
import { Container } from "react-bootstrap";
import { Alert } from "@mui/material";

type State = {
    triggerSuccess: Boolean,
    processingActive: Boolean,
    triggerFailure: Boolean,
    uploadResponseMessage: String
}

class ProcessingTriggerButton extends React.Component<{}, State> {

    constructor(props: any) {
        super(props)
        this.state = {
            triggerSuccess: false,
            processingActive: false,
            triggerFailure: false,
            uploadResponseMessage: ""
        }
    }


    triggerBackendProcessing = () => {
        // reset response message state
        this.setState({triggerSuccess:false, triggerFailure:false, processingActive:true, uploadResponseMessage:""})
        let responseMessage;
        axios.patch(`${process.env.REACT_APP_API_BASE_URL}/datasets/default/results`)  
        .then((response) => {
            responseMessage = `Status ${response.status}: ${response.data.message}`
            this.setState({triggerSuccess:true, processingActive:false, uploadResponseMessage:responseMessage})
        })
        .catch((error) => {
            responseMessage = `Status ${error.response.status}: ${error.response.data.detail}`
            this.setState({triggerFailure:true, processingActive:false, uploadResponseMessage:responseMessage})
        });
    ;
    };

    renderTriggerResponse = () => {
        console.log(this.state.uploadResponseMessage)
        if (this.state.triggerSuccess) {
            return <Alert severity="success">{this.state.uploadResponseMessage}</Alert>
        } else if (this.state.triggerFailure) {
            return <Alert severity="error">{this.state.uploadResponseMessage}</Alert>
        } else if (this.state.processingActive) {
            return <Alert severity="warning">Waiting for API response.</Alert>
        } else {
            return <Alert severity="info">Waiting for processing trigger.</Alert>;
        }
    }

    render() {
        return (
            <Container>
                <div className="processingTriggerButton">
                    <button onClick={this.triggerBackendProcessing}>
                        Trigger Result Processing
                    </button>
                </div>
                <div className="triggerResponse">
                    {this.renderTriggerResponse()}
                </div>
            </Container>
        )
    }

}

export default ProcessingTriggerButton;
