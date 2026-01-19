import React from "react";

type Props = {
  value: number;
  maxValue?: number;
  stepsColors?: string[];
  size?: number;
  strokeWidth?: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const ScoreIndicator: React.FC<Props> = ({
  value,
  maxValue = 100,
  stepsColors,
  size = 160,
  strokeWidth = 14,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = clamp(value, 0, maxValue);
  const percent = (normalized / maxValue) * 100;
  const dashOffset = circumference * (1 - percent / 100);

  // choose color based on stepsColors thresholds if provided
  let color = "#53b83a"; // default green
  if (stepsColors && stepsColors.length > 0) {
    const bins = stepsColors.length;
    const idx = Math.min(bins - 1, Math.floor((percent / 100) * bins));
    color = stepsColors[idx];
  } else {
    // fallback gradient by value
    if (percent >= 80) color = "#53b83a";
    else if (percent >= 60) color = "#84c42b";
    else if (percent >= 40) color = "#f1bc00";
    else if (percent >= 20) color = "#ed8d00";
    else color = "#d12000";
  }

  const center = size / 2;

  return (
    <div style={{ width: size, height: size, display: "inline-block" }}>
      <svg width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e9edf3"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.22}
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
          fill="#1a1f36"
          fontWeight={700}
        >
          {Math.round(percent)}
          <tspan
            dx={4}
            dy={-size * 0.02}
            fontSize={size * 0.12}
            fill="#5b6475"
            fontWeight={600}
          >
            %
          </tspan>
        </text>
      </svg>
    </div>
  );
};

export default ScoreIndicator;
