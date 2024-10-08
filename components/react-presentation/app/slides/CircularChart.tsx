import React from 'react';

interface CircularChartProps {
  solarPercentage: number;
  efficiencyPercentage: number;
  utilityPercentage: number;
  solarKWh: number;
  utilityKWh: number;
  size?: number;
  strokeWidth?: number;
  showEfficiency?: boolean;
  className?: string;
}

const CircularChart: React.FC<CircularChartProps> = ({
  solarPercentage,
  efficiencyPercentage,
  utilityPercentage,
  solarKWh,
  utilityKWh,
  size = 120,
  strokeWidth = 10,
  showEfficiency = true,
  className = null
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const solarRotations = Math.floor(solarPercentage / 100);
  const solarRemainder = solarPercentage % 100;
  
  const totalPercentage = solarPercentage + efficiencyPercentage + utilityPercentage;
  const scaleFactor = 100 / totalPercentage;

  const scaledSolarPercentage = solarPercentage * scaleFactor;
  const scaledEfficiencyPercentage = efficiencyPercentage * scaleFactor;
  const scaledUtilityPercentage = utilityPercentage * scaleFactor;

  const solarOffset = circumference - (scaledSolarPercentage / 100) * circumference;
  const efficiencyOffset = solarOffset - (scaledEfficiencyPercentage / 100) * circumference;
  const utilityOffset = efficiencyOffset - (scaledUtilityPercentage / 100) * circumference;

  return (
    <div className={className || "chc-circular-chart-card"}>
      <div className="chc-circular-chart" style={{ height: size, display:'flex' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            className="chc-circle-background"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="#e6e6e6"
          />
          <circle
            className="chc-circle-utility"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="#CCCCCC"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={utilityOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <circle
            className="chc-circle-efficiency"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="#4CAF50"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={efficiencyOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <circle
            className="chc-circle-solar"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="#FFA500"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={solarOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            fontSize={size / 5}
            fontWeight="bold"
            fill="#333"
          >
            {`${(solarPercentage + efficiencyPercentage).toFixed(0)}%`}
          </text>
          {/* <text
            x="50%"
            y="60%"
            textAnchor="middle"
            dy=".3em"
            fontSize="14"
            fill="#666"
          >
            Solar
          </text> */}
        </svg>
        <div className="chc-chart-legend">
          <div className="chc-legend-item">
            <span className="chc-legend-color" style={{ backgroundColor: '#FFA500', width: '20px', height: '10px', borderRadius: '5px' }}></span>
            {/* <span className="legend-label">Solar: {solarKWh.toFixed(1)} kWh ({solarPercentage.toFixed(1)}%)</span> */}
            <span className="chc-legend-label">Solar</span>

          </div>
          {showEfficiency && (
          <div className="chc-legend-item">
            <span className="chc-legend-color" style={{ backgroundColor: '#4CAF50', width: '20px', height: '10px', borderRadius: '5px' }}></span>
            {/* <span className="legend-label">Efficiency: {(efficiencyPercentage * (solarKWh + utilityKWh) / 100).toFixed(1)} kWh ({efficiencyPercentage.toFixed(1)}%)</span> */}
            <span className="chc-legend-label">Efficiency</span>
          
          </div>)}
          <div className="chc-legend-item">
            <span className="chc-legend-color" style={{ backgroundColor: '#CCCCCC', width: '20px', height: '10px', borderRadius: '5px' }}></span>
            {/* <span className="legend-label">Utility: {utilityKWh.toFixed(1)} kWh ({utilityPercentage.toFixed(1)}%)</span> */}
            <span className="chc-legend-label">Utility</span>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularChart;
