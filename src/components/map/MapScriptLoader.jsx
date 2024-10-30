import React from 'react';
import { LoadScript } from '@react-google-maps/api';

const libraries = ['places', 'marker'];

const MapScriptLoader = ({ children }) => {
  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={<div>Loading...</div>}
    >
      {children}
    </LoadScript>
  );
};

export default MapScriptLoader;