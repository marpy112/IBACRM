import React, { useEffect, useMemo, useState } from 'react';
import Map, {
  FullscreenControl,
  GeolocateControl,
  Layer,
  MapRef,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ResearchLocation } from '../types/research';
import './MapContainer.css';

export interface MapContainerProps {
  accessToken: string;
  locations?: ResearchLocation[];
  selectedLocationId?: string | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  accessToken,
  locations = [],
  selectedLocationId,
}) => {
  const [popupInfo, setPopupInfo] = useState<ResearchLocation | null>(null);
  const [highlightedLocationIds, setHighlightedLocationIds] = useState<string[]>([]);
  const [activeResearchId, setActiveResearchId] = useState<string | null>(null);
  const [activeResearchIndex, setActiveResearchIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewState, setViewState] = useState({
    longitude: 125.0,
    latitude: 8.5,
    zoom: 7,
    pitch: 0,
    bearing: 0,
  });
  const mapRef = React.useRef<MapRef | null>(null);

  const filteredLocations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return locations;
    }

    return locations.filter((location) => {
      const researchText = location.researches
        .map(
          (research) =>
            `${research.title} ${research.description} ${research.researchers
              .map((researcher) => `${researcher.name} ${researcher.degree}`)
              .join(' ')}`
        )
        .join(' ');

      return `${location.name} ${researchText}`.toLowerCase().includes(query);
    });
  }, [locations, searchTerm]);

  const handleMapLoad = (evt: { target: mapboxgl.Map }) => {
    const map = evt.target;
    mapRef.current = map as unknown as MapRef;

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

    poiLayersToHide.forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      } catch {
        // Skip missing layers from the current style.
      }
    });
  };

  useEffect(() => {
    if (!selectedLocationId) {
      return;
    }

    const location = locations.find((loc) => loc.id === selectedLocationId);
    if (!location) {
      return;
    }

    setViewState((prev) => ({
      ...prev,
      longitude: location.longitude,
      latitude: location.latitude,
      zoom: 12,
      pitch: 20,
      bearing: 0,
    }));
    setPopupInfo(location);
    setHighlightedLocationIds([location.id]);
    setActiveResearchId(null);
    setActiveResearchIndex(0);
  }, [selectedLocationId, locations]);

  const highlightedLocations = useMemo(
    () => locations.filter((location) => highlightedLocationIds.includes(location.id)),
    [highlightedLocationIds, locations]
  );

  const highlightedShapeData = useMemo(() => {
    if (highlightedLocations.length < 2) {
      return null;
    }

    const sortedCoordinates = highlightedLocations
      .map((location) => [location.longitude, location.latitude] as [number, number])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    if (highlightedLocations.length === 2) {
      return {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: sortedCoordinates,
            },
          },
        ],
      };
    }

    const centroid = sortedCoordinates.reduce(
      (acc, [lng, lat]) => ({
        lng: acc.lng + lng / sortedCoordinates.length,
        lat: acc.lat + lat / sortedCoordinates.length,
      }),
      { lng: 0, lat: 0 }
    );

    const polygonCoordinates = [...sortedCoordinates]
      .sort((a, b) => {
        const angleA = Math.atan2(a[1] - centroid.lat, a[0] - centroid.lng);
        const angleB = Math.atan2(b[1] - centroid.lat, b[0] - centroid.lng);
        return angleA - angleB;
      });

    polygonCoordinates.push(polygonCoordinates[0]);

    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Polygon' as const,
            coordinates: [polygonCoordinates],
          },
        },
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: polygonCoordinates,
          },
        },
      ],
    };
  }, [highlightedLocations]);

  const visibleLocations = useMemo(() => {
    if (highlightedLocationIds.length === 0) {
      return filteredLocations;
    }

    return filteredLocations.filter((location) => highlightedLocationIds.includes(location.id));
  }, [filteredLocations, highlightedLocationIds]);

  const focusLocations = (targetLocations: ResearchLocation[], primaryLocation?: ResearchLocation) => {
    if (targetLocations.length === 0) {
      return;
    }

    if (primaryLocation) {
      setPopupInfo(primaryLocation);
    }

    setHighlightedLocationIds(targetLocations.map((location) => location.id));

    if (targetLocations.length === 1) {
      const [location] = targetLocations;
      setViewState((prev) => ({
        ...prev,
        longitude: location.longitude,
        latitude: location.latitude,
        zoom: 11.5,
        pitch: 20,
        bearing: 0,
      }));
      return;
    }

    const longitudes = targetLocations.map((location) => location.longitude);
    const latitudes = targetLocations.map((location) => location.latitude);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ];

    if (mapRef.current && 'fitBounds' in mapRef.current) {
      (mapRef.current as unknown as { fitBounds: (bounds: [[number, number], [number, number]], options: { padding: number; duration: number }) => void }).fitBounds(bounds, {
        padding: 120,
        duration: 900,
      });
    }
  };

  const handleLocationFocus = (location: ResearchLocation) => {
    setActiveResearchId(null);
    setActiveResearchIndex(0);
    focusLocations([location], location);
  };

  const handleResearchHighlight = (research: ResearchLocation['researches'][number]) => {
    const locationIds = research.locationIds?.length ? research.locationIds : popupInfo ? [popupInfo.id] : [];
    const targetLocations = locations.filter((location) => locationIds.includes(location.id));
    setActiveResearchId(research.id);
    setActiveResearchIndex(0);
    focusLocations(targetLocations, popupInfo || targetLocations[0]);
  };

  const clearResearchHighlight = () => {
    setHighlightedLocationIds(popupInfo ? [popupInfo.id] : []);
    setActiveResearchId(null);
    setActiveResearchIndex(0);
  };

  const visibleResearches = useMemo(() => {
    if (!popupInfo) {
      return [];
    }

    if (!activeResearchId) {
      return popupInfo.researches;
    }

    return popupInfo.researches.filter((research) => research.id === activeResearchId);
  }, [activeResearchId, popupInfo]);

  useEffect(() => {
    setActiveResearchIndex(0);
  }, [popupInfo?.id, activeResearchId]);

  const activeResearch = visibleResearches[activeResearchIndex] || null;

  const showPreviousResearch = () => {
    setActiveResearchIndex((prev) =>
      prev === 0 ? visibleResearches.length - 1 : prev - 1
    );
  };

  const showNextResearch = () => {
    setActiveResearchIndex((prev) =>
      prev === visibleResearches.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="map-wrapper">
      <div className="map-search-panel">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="map-search-input"
          placeholder="Search every location, research, or researcher"
        />
        {searchTerm.trim() && (
          <div className="map-search-results">
            {visibleLocations.length === 0 ? (
              <p className="map-search-empty">No matching locations found.</p>
            ) : (
              visibleLocations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  className="map-search-result"
                  onClick={() => handleLocationFocus(location)}
                >
                  <span>{location.name}</span>
                  <small>
                    {location.researches.length} research{location.researches.length !== 1 ? 'es' : ''}
                  </small>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={accessToken}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        attributionControl
        scrollZoom
        dragPan
        dragRotate
        doubleClickZoom
        touchZoomRotate
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" trackUserLocation />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-right" />

        {highlightedLocations.length > 0 && (
          <Source
            id="highlight-area"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: highlightedLocations.map((location) => ({
                type: 'Feature',
                properties: {
                  radiusKm: location.radiusKm,
                },
                geometry: {
                  type: 'Point',
                  coordinates: [location.longitude, location.latitude],
                },
              })),
            }}
          >
            <Layer
              id="highlight-glow-outer"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  ['/', ['*', ['get', 'radiusKm'], 1.5], 40],
                  24,
                  ['*', ['get', 'radiusKm'], 3],
                ],
                'circle-color': '#ff0000',
                'circle-opacity': 0.08,
              }}
            />
            <Layer
              id="highlight-glow-middle"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  ['/', ['get', 'radiusKm'], 40],
                  24,
                  ['*', ['get', 'radiusKm'], 2],
                ],
                'circle-color': '#ff0000',
                'circle-opacity': 0.12,
              }}
            />
            <Layer
              id="highlight-area-fill"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  ['/', ['*', ['get', 'radiusKm'], 0.8], 40],
                  24,
                  ['*', ['get', 'radiusKm'], 1.6],
                ],
                'circle-color': '#ff0000',
                'circle-opacity': 0.2,
              }}
            />
            <Layer
              id="highlight-area-border"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  ['/', ['*', ['get', 'radiusKm'], 0.8], 40],
                  24,
                  ['*', ['get', 'radiusKm'], 1.6],
                ],
                'circle-color': '#ff0000',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ff0000',
                'circle-opacity': 0.6,
              }}
            />
          </Source>
        )}

        {highlightedShapeData && (
          <Source
            id="highlight-shape"
            type="geojson"
            data={highlightedShapeData}
          >
            <Layer
              id="highlight-shape-fill"
              type="fill"
              filter={['==', ['geometry-type'], 'Polygon']}
              paint={{
                'fill-color': '#ff6b4a',
                'fill-opacity': 0.12,
              }}
            />
            <Layer
              id="highlight-shape-line"
              type="line"
              paint={{
                'line-color': '#b01212',
                'line-width': 3,
                'line-opacity': 0.85,
              }}
            />
          </Source>
        )}

        {visibleLocations.map((location) => {
          const isSelected =
            location.id === selectedLocationId ||
            location.id === popupInfo?.id ||
            highlightedLocationIds.includes(location.id);
          return (
            <Marker
              key={location.id}
              longitude={location.longitude}
              latitude={location.latitude}
            >
              <button
                className={`marker-button ${isSelected ? 'selected' : ''}`}
                onClick={() => setPopupInfo(location)}
                title={location.name}
              >
                <div className={`marker ${isSelected ? 'marker-selected' : ''}`}>
                  {highlightedLocationIds.includes(location.id) && (
                    <span className="marker-location-label">{location.name}</span>
                  )}
                  <div className="marker-icon">{isSelected ? '*' : 'o'}</div>
                  <span className="marker-count">{location.researches.length}</span>
                </div>
              </button>
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton
            anchor="bottom"
            maxWidth="380px"
          >
            <div className="popup-content">
              <h3>{popupInfo.name}</h3>
              <p className="popup-summary">
                {popupInfo.researches.length} research{popupInfo.researches.length !== 1 ? 'es' : ''} in this location
              </p>
              {highlightedLocationIds.length > 1 && (
                <button
                  type="button"
                  className="clear-highlight-button"
                  onClick={clearResearchHighlight}
                >
                  Show all researches for this location again
                </button>
              )}
              {activeResearch && (
                <div className="popup-research-list">
                  {visibleResearches.length > 1 && (
                    <div className="popup-slider-controls">
                      <button type="button" className="popup-slider-button" onClick={showPreviousResearch}>
                        Prev
                      </button>
                      <span className="popup-slider-count">
                        {activeResearchIndex + 1} / {visibleResearches.length}
                      </span>
                      <button type="button" className="popup-slider-button" onClick={showNextResearch}>
                        Next
                      </button>
                    </div>
                  )}
                  <article key={activeResearch.id} className="popup-research-card">
                    <button
                      type="button"
                      className="popup-research-title"
                      onClick={() => handleResearchHighlight(activeResearch)}
                    >
                      {activeResearch.title}
                    </button>
                    <div className="researchers">
                      <strong>Researchers</strong>
                      <ul>
                        {activeResearch.researchers.map((researcher) => (
                          <li key={`${activeResearch.id}-${researcher.name}-${researcher.degree}`}>
                            {researcher.degree ? `${researcher.name}, ${researcher.degree}` : researcher.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {activeResearch.locationIds && activeResearch.locationIds.length > 1 && (
                      <p className="linked-location-note">
                        Shared across {activeResearch.locationIds.length} locations
                      </p>
                    )}
                  </article>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};
