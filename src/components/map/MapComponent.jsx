import React, { useEffect, useRef } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import './MapComponent.css';

const MapComponent = ({ events, filteredEvents }) => {
  const center = { lat: 39.9334, lng: 32.8597 };
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    return () => {
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (marker) marker.setMap(null);
        });
        markersRef.current = [];
      }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateMarkers = () => {
      if (!mapRef.current || !window.google) {
        return;
      }

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      markersRef.current = [];

      const shouldUseFiltered = Array.isArray(filteredEvents);
      const markersToDisplay = shouldUseFiltered ? filteredEvents : events;

      markersToDisplay
        .filter(event => event.status !== 'pending')
        .forEach(event => {
          if (event.coordinates && event.coordinates.lat && event.coordinates.lng) {
            try {
              const marker = new window.google.maps.marker.AdvancedMarkerElement({
                position: {
                  lat: event.coordinates.lat,
                  lng: event.coordinates.lng
                },
                map: mapRef.current
              });
              markersRef.current.push(marker);
            } catch (error) {
              console.error('Error creating marker:', error);
            }
          }
        });
    };

    if (mapRef.current) {
      updateMarkers();
    }
  }, [events, filteredEvents]);

  return (
    <div className="map-container">
      <GoogleMap
        onLoad={(map) => {
          mapRef.current = map;

          const shouldUseFiltered = Array.isArray(filteredEvents);
          const markersToDisplay = shouldUseFiltered ? filteredEvents : events;
          
          markersToDisplay
            .filter(event => event.status !== 'pending') // Filter out pending events
            .forEach(event => {
              if (event.coordinates && event.coordinates.lat && event.coordinates.lng) {
                try {
                  const marker = new window.google.maps.marker.AdvancedMarkerElement({
                    position: {
                      lat: event.coordinates.lat,
                      lng: event.coordinates.lng
                    },
                    map: map
                  });
                  markersRef.current.push(marker);
                } catch (error) {
                  console.error('Error creating marker:', error);
                }
              }
            });
        }}
        mapContainerClassName="map"
        zoom={4}
        center={center}
        options={{
          mapId: "6100ebed9733d3ab",
        }}
      />
    </div>
  );
};

export default MapComponent;
