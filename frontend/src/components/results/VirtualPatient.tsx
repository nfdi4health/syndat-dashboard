import React from "react";
import { Badge, Col, Container, Row } from "react-bootstrap"
import Select from 'react-select'

type Props = {
    id: number,
    fields: Array<String>,
    data: Array<String>,
    hide: Boolean
}

type State = {
    fieldSelected: any,
    fieldsFormatted: any 
}

class VirtualPatient extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        const fieldsFormatted = this.props.fields.map((x: any) => {
            return({vale: x, label: x});
          });
        this.state = {
            fieldsFormatted: fieldsFormatted,
            fieldSelected: {vale: fieldsFormatted[0], label: fieldsFormatted[0]}
        }
        this.handleDropdownChange.bind(this);
    }

    handleDropdownChange = (selectedOption:any) => {
        this.setState({fieldSelected: selectedOption});
    }

    render () {
        return (
            <Container>
            {(() => {
                if (this.props.hide === false) {
                    var selectedField =  this.state.fieldSelected.label
                    var fieldIdx = this.props.fields.indexOf(selectedField)
                    var selectedValue = this.props.data[fieldIdx]
                    return (
                        <Row>
                        <Col><Badge>Virtual Patient {this.props.id}</Badge></Col>
                        <Col><Select options={this.state.fieldsFormatted} onChange={this.handleDropdownChange.bind(this)}/></Col>
                        <Col>{selectedValue}</Col>
                    </Row>
                    )
                } else {
                    return (<div></div>)
                }
            })()}
        </Container>
        )
    }

}

export default VirtualPatient