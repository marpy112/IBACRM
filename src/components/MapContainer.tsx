import React, { useState } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, FullscreenControl, ScaleControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapContainer.css';

interface ResearchLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  researchers: string[];
  radiusKm: number;
}

export interface MapContainerProps {
  accessToken: string;
  locations?: ResearchLocation[];
  selectedLocationId?: string | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({ accessToken, locations = [], selectedLocationId }) => {
  const [popupInfo, setPopupInfo] = useState<ResearchLocation | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 125.0,
    latitude: 8.5,
    zoom: 7,
    pitch: 0,
    bearing: 0,
  });
  const mapRef = React.useRef<any>(null);

  // Hide POI layers when map loads
  const handleMapLoad = (evt: any) => {
    const map = evt.target;
    mapRef.current = map;

    // List of POI layer IDs to hide in Mapbox outdoor style
    const poiLayersToHide = [
      'poi-label',
      'poi',
      'poi-scalerank0',
      'poi-scalerank1',
      'poi-scalerank2',
      'poi-scalerank3',
      'poi-scalerank4',
      'poi_label',
      'poi_icon',
      'natural-point-label',
    ];

    poiLayersToHide.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      } catch (e) {
        // Layer doesn't exist, skip
      }
    });
  };

  // Zoom to selected location
  React.useEffect(() => {
    if (selectedLocationId) {
      const location = locations.find(loc => loc.id === selectedLocationId);
      if (location) {
        setViewState(prev => ({
          ...prev,
          longitude: location.longitude,
          latitude: location.latitude,
          zoom: 12,
          pitch: 20,
          bearing: 0,
        }));
        setPopupInfo(location);
      }
    }
  }, [selectedLocationId, locations]);

  return (
    <div className="map-wrapper">
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        longitude={viewState.longitude}
        latitude={viewState.latitude}
        zoom={viewState.zoom}
        pitch={viewState.pitch}
        bearing={viewState.bearing}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={accessToken}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        attributionControl={true}
        scrollZoom={true}
        dragPan={true}
        dragRotate={true}
        doubleClickZoom={true}
        touchZoomRotate={true}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        
        {/* Geolocation Control */}
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
        />
        
        {/* Fullscreen Control */}
        <FullscreenControl position="top-right" />
        
        {/* Scale Control */}
        <ScaleControl position="bottom-right" />

        {/* Red glowing area highlight for selected location */}
        {selectedLocationId && popupInfo && (
          <Source
            id="highlight-area"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [popupInfo.longitude, popupInfo.latitude],
              },
            }}
          >
            {/* Outer glow - larger, more transparent */}
            <Layer
              id="highlight-glow-outer"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  (popupInfo.radiusKm * 1.5) / 40,
                  24,
                  (popupInfo.radiusKm * 1.5) * 2,
                ],
                'circle-color': '#ff0000',
                'circle-opacity': 0.08,
              }}
            />
            
            {/* Middle glow - medium transparency */}
            <Layer
              id="highlight-glow-middle"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  popupInfo.radiusKm / 40,
                  24,
                  popupInfo.radiusKm * 2,
                ],
                'circle-color': '#ff0000',
                'circle-opacity': 0.12,
              }}
            />
            
            {/* Inner fill - solid red */}
            <Layer
              id="highlight-area-fill"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  (popupInfo.radiusKm * 0.8) / 40,
                  24,
                  popupInfo.radiusKm * 1.6,
                ],
                'circle-color': '#ff0000',
                'circle-opacity': 0.2,
              }}
            />
            
            {/* Border - red outline */}
            <Layer
              id="highlight-area-border"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  (popupInfo.radiusKm * 0.8) / 40,
                  24,
                  popupInfo.radiusKm * 1.6,
                ],
                'circle-color': '#ff0000',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ff0000',
                'circle-opacity': 0.6,
              }}
            />
          </Source>
        )}
        {/* Research Location Markers */}
        {locations.map((location) => {
          const isSelected = location.id === selectedLocationId;
          return (
            <Marker
              key={location.id}
              longitude={location.longitude}
              latitude={location.latitude}
            >
              <button
                className={`marker-button ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setPopupInfo(location);
                }}
                title={location.name}
              >
                <div className={`marker ${isSelected ? 'marker-selected' : ''}`}>
                  <div className="marker-icon">{isSelected ? '⭐' : '📍'}</div>
                </div>
              </button>
            </Marker>
          );
        })}

        {/* Location Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            anchor="bottom"
          >
            <div className="popup-content">
              <h3>{popupInfo.name}</h3>
              <p>{popupInfo.description}</p>
              {popupInfo.researchers.length > 0 && (
                <div className="researchers">
                  <strong>Researchers:</strong>
                  <ul>
                    {popupInfo.researchers.map((researcher, idx) => (
                      <li key={idx}>{researcher}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};
