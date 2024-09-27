import React from 'react';
import GoogleMaps from './GoogleMaps';
import { GOOGLE_MAPS_API_KEY, MAP_ID } from './config';
import ErrorBoundary from './ErrorBoundary';
import { observer } from '@legendapp/state/react';

const SiteConfirmation = observer(function SiteConfirmation() {
  return (
     <ErrorBoundary>
      <GoogleMaps apiKey={GOOGLE_MAPS_API_KEY} mapId={MAP_ID} />
    </ErrorBoundary>
  );
});

export default SiteConfirmation;
