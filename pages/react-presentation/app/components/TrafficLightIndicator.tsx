import React from 'react';

interface TrafficLightIndicatorProps {
  completedPhotos: number;
  requiredPhotos: number;
}

const TrafficLightIndicator: React.FC<TrafficLightIndicatorProps> = ({ completedPhotos, requiredPhotos }) => {
  if (requiredPhotos === 0) return null;

  const getColor = () => {
    if (completedPhotos === 0) return '#FF0000'; // Red
    if (completedPhotos < requiredPhotos) return '#FFA500'; // Orange
    return '#00FF00'; // Green
  };

  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="none" stroke="#333" strokeWidth="1" />
      <circle cx="8" cy="8" r="5" fill={getColor()} />
    </svg>
  );
};

export default TrafficLightIndicator;
