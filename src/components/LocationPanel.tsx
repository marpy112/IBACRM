import React, { useState } from 'react';
import './LocationPanel.css';

interface ResearchLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  researchers: string[];
  radiusKm: number;
}

interface LocationPanelProps {
  locations: ResearchLocation[];
  onLocationSelect?: (location: ResearchLocation) => void;
}

export const LocationPanel: React.FC<LocationPanelProps> = ({
  locations,
  onLocationSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`location-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide locations' : 'Show locations'}
      >
        {isExpanded ? '▼' : '▶'} Research Locations ({locations.length})
      </button>

      {isExpanded && (
        <div className="panel-content">
          {locations.length === 0 ? (
            <p className="empty-message">No research locations found</p>
          ) : (
            <ul className="locations-list">
              {locations.map((location) => (
                <li key={location.id} className="location-item">
                  <button
                    className="location-button"
                    onClick={() => onLocationSelect?.(location)}
                  >
                    <span className="location-name">{location.name}</span>
                    <span className="location-coords">
                      ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
                    </span>
                    {location.researchers.length > 0 && (
                      <span className="researcher-count">
                        {location.researchers.length} researcher{location.researchers.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
