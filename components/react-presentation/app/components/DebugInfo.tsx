import React from 'react';

interface DebugInfoProps {
  showDebugInfo: boolean;
  storageUsage: string;
  storageLimit: string;
  recordId: string;
  salesforcePhotosCount: number;
  photoCaptureSectionsCount: number;
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  showDebugInfo,
  storageUsage,
  storageLimit,
  recordId,
  salesforcePhotosCount,
  photoCaptureSectionsCount,
}) => {
  if (!showDebugInfo) return null;

  return (
    <div className="debug-info">
      <h3>Debug Information:</h3>
      <p>Indexed DB Storage Usage: {storageUsage} / {storageLimit}</p>
      <p>Record ID: {recordId}</p>
      <p>Number of Salesforce Photos: {salesforcePhotosCount}</p>
      <p>Number of Photo Capture Sections: {photoCaptureSectionsCount}</p>
    </div>
  );
};

export default DebugInfo;
