import { Checkbox, Slider } from "@mui/material";
import React from "react";
import { Col, Row } from "react-bootstrap";
import Select from "react-select";

type ColumnConstraint = {
  name: string;
  category?: string;
  minval?: number;
  maxval?: number;
};

type State = {
  checked: boolean;
  disabled: boolean;
  categoricalSelected: string;
  name: string;
  datatype: string;
  options: any;
  range: Array<number>;
  sliderChangedRecently: boolean;
};

type Props = {
  handler: (constraint: ColumnConstraint) => void;
  name: string;
  datatype: string;
  options: Array<String>;
  minval: number;
  maxval: number;
};

class PatientSearchFormEntry extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      checked: true,
      disabled: false,
      categoricalSelected: "",
      name: props.name,
      datatype: props.datatype,
      options: [{ value: "loading..", label: "loading.." }],
      range: [props.minval, props.maxval],
      sliderChangedRecently: false,
    };
    this.handleDropdownChange.bind(this);
  }

  componentDidUpdate(prevProps : Props) {
    if (this.props.name !== prevProps.name) {
      // fixes a bug with form labels not correctly updating after dataset swap
      this.setState({name:this.props.name})
      this.reformatOptions();
    }
}

  reformatOptions = () => {
    if (this.props.options !== null) {
      const optionsReformated = this.props.options.map((x: any) => {
        return { value: x, label: x };
      });
      console.log("reformatOptions")
      this.setState({ options: optionsReformated });
      console.log(this.state.options)
    }
  };

  handleDropdownChange = (selectedOption: any) => {
    this.setState({
      categoricalSelected: selectedOption.value,
      checked: false,
      disabled: true,
    });
    this.props.handler({
      name: this.state.name,
      category: selectedOption.value,
    });
  };

  handleSliderChange = (event: any, newValue: number | number[]) => {
    // renew timeout
    this.setState({ sliderChangedRecently: true });
    var newRange = newValue as number[];
    this.setState({ range: newRange, checked: false, disabled: true });
    this.startSliderChangedTimeout();
  };

  startSliderChangedTimeout = () => {
    setTimeout(() => {
      this.commitSliderState();
    }, 1000);
  };

  commitSliderState = () => {
    // commit state to parent component after no change for 1000 ms
      this.props.handler({
        name: this.state.name,
        minval: this.state.range[0],
        maxval: this.state.range[1],
      });
  };

  render() {
    const columnType = this.props.datatype;
    let middleColumn;
    if (columnType === "object") {
      middleColumn = (
        <Select
          options={this.state.options}
          onChange={this.handleDropdownChange}
        />
      );
    } else {
      middleColumn = (
        <Slider
          min={this.props.minval}
          max={this.props.maxval}
          value={this.state.range}
          onChange={this.handleSliderChange}
          valueLabelDisplay="auto"
          step={1}
        />
      );
    }
    return (
      <Row>
        <Col>{this.state.name}</Col>
        <Col>{middleColumn}</Col>
        <Col>
          any{" "}
          <Checkbox
            checked={this.state.checked}
            disabled={this.state.disabled}
            disableRipple={true}
          />
        </Col>
      </Row>
    );
  }
}

export default PatientSearchFormEntry;
