import React from 'react';

interface DonutChartProps {
  percentage: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ percentage }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="450" height="450" viewBox="0 0 200 200">
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="#E0E0E0"
        strokeWidth="20"
      />
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="#023B95"
        strokeWidth="20"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 100 100)"
      />
      <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="36" fontWeight="bold">
        {percentage}%
      </text>
    </svg>
  );
};

export default DonutChart;
