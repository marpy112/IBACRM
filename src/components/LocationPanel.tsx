import React, { useMemo, useState } from 'react';
import type { ResearchLocation } from '../types/research';
import './LocationPanel.css';

interface LocationPanelProps {
  locations: ResearchLocation[];
  onLocationSelect?: (location: ResearchLocation) => void;
}

export const LocationPanel: React.FC<LocationPanelProps> = ({
  locations,
  onLocationSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return locations;
    }

    return locations.filter((location) => {
      const researchers = location.researches
        .flatMap((research) => research.researchers)
        .map((researcher) => `${researcher.name} ${researcher.degree}`)
        .join(' ');
      const researchTitles = location.researches.map((research) => research.title).join(' ');

      return [location.name, researchTitles, researchers].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [locations, searchTerm]);

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
          <div className="location-search-wrap">
            <input
              type="search"
              className="location-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search location, research, or researcher"
            />
          </div>

          {filteredLocations.length === 0 ? (
            <p className="empty-message">No research locations found</p>
          ) : (
            <ul className="locations-list">
              {filteredLocations.map((location) => {
                const researcherCount = new Set(
                  location.researches.flatMap((research) => research.researchers.map((researcher) => researcher.name))
                ).size;

                return (
                  <li key={location.id} className="location-item">
                    <button
                      className="location-button"
                      onClick={() => onLocationSelect?.(location)}
                    >
                      <span className="location-name">{location.name}</span>
                      <span className="location-coords">
                        ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
                      </span>
                      <span className="location-summary">
                        {location.researches.length} research
                        {location.researches.length !== 1 ? 'es' : ''} and {researcherCount} researcher
                        {researcherCount !== 1 ? 's' : ''}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
