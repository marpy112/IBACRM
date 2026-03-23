import { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapPicker.css';

interface MapPickerProps {
  latitude: number | string;
  longitude: number | string;
  onCoordinatesChange: (latitude: number, longitude: number) => void;
  accessToken: string;
}

export default function MapPicker({
  latitude,
  longitude,
  onCoordinatesChange,
  accessToken,
}: MapPickerProps) {
  const [viewState, setViewState] = useState({
    longitude: typeof longitude === 'string' ? 125.0 : parseFloat(longitude.toString()),
    latitude: typeof latitude === 'string' ? 8.5 : parseFloat(latitude.toString()),
    zoom: 7,
    pitch: 0,
    bearing: 0,
  });

  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    setViewState((prev) => ({
      ...prev,
      longitude: lng,
      latitude: lat,
    }));
    onCoordinatesChange(lat, lng);
  }, [onCoordinatesChange]);

  return (
    <div className="map-picker-container">
      <div className="map-picker-header">
        <h3>Click on Map to Set Location</h3>
        <div className="coordinates-display">
          <p>Lat: <span>{typeof latitude === 'string' ? (latitude || '—') : latitude.toFixed(4)}</span></p>
          <p>Lng: <span>{typeof longitude === 'string' ? (longitude || '—') : longitude.toFixed(4)}</span></p>
        </div>
      </div>
      
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '8px',
          cursor: 'crosshair',
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={accessToken}
        scrollZoom={true}
        doubleClickZoom={true}
        dragPan={true}
        dragRotate={true}
      >
        <NavigationControl position="top-left" />
        
        {latitude && longitude && (
          <Marker
            longitude={typeof longitude === 'string' ? parseFloat(longitude) : longitude}
            latitude={typeof latitude === 'string' ? parseFloat(latitude) : latitude}
            anchor="bottom"
          >
            <div className="marker-pin">📍</div>
          </Marker>
        )}
      </Map>

      <div className="map-picker-instructions">
        <p>Click anywhere on the map to set the research location coordinates</p>
      </div>
    </div>
  );
}
