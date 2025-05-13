import React from "react";
import { FormControlLabel, Checkbox, Tooltip } from "@mui/material";

type Props = {
  options: PostProcessingOptions;
  onChange: (updated: PostProcessingOptions) => void;
};

export type PostProcessingOptions = {
  normalize_scale: boolean;
  assert_minmax: boolean;
  normalize_float_precision: boolean;
};

const PostProcessingOptions = ({ options, onChange }: Props) => {
  const handleChange = (key: keyof PostProcessingOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  return (
    <div>
      <Tooltip title="Rescale numerical features to a consistent range (e.g., 0-1)." arrow>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.normalize_scale}
              onChange={() => handleChange("normalize_scale")}
            />
          }
          label="Normalize Scale"
        />
      </Tooltip>

      <Tooltip title="Check that all features remain within expected min/max bounds." arrow>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.assert_minmax}
              onChange={() => handleChange("assert_minmax")}
            />
          }
          label="Assert Min/Max"
        />
      </Tooltip>

      <Tooltip title="Limit floating-point precision (e.g., round to 2 decimals)." arrow>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.normalize_float_precision}
              onChange={() => handleChange("normalize_float_precision")}
            />
          }
          label="Normalize Float Precision"
        />
      </Tooltip>
    </div>
  );
};

export default PostProcessingOptions;