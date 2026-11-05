import React, { useMemo, useState } from 'react';
import type { ResearchLocation } from '../types/research';
import { Icon } from './Icon';
import './LocationPanel.css';

interface LocationPanelProps {
  locations: ResearchLocation[];
  selectedLocationId?: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onLocationSelect?: (location: ResearchLocation) => void;
}

export const LocationPanel: React.FC<LocationPanelProps> = ({
  locations,
  selectedLocationId,
  searchTerm,
  onSearchChange,
  onLocationSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const studyCount = new Set(locations.flatMap((location) => location.researches.map((research) => research.id))).size;

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
      const researchTitles = location.researches.map((research) => `${research.title} ${research.description}`).join(' ');

      return [location.name, researchTitles, researchers].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [locations, searchTerm]);

  return (
    <aside className={`location-panel ${isExpanded ? 'expanded' : 'collapsed'}`} aria-label="Research directory">
      <div className="directory-intro">
        <p className="eyebrow">Explore the atlas</p>
        <h2>Research, rooted<br />in place.</h2>
        <p>Discover the people, places, and studies shaping our communities.</p>
        <div className="directory-stats"><span><strong>{locations.length}</strong> locations</span><span><strong>{studyCount}</strong> studies</span></div>
      </div>
      <button
        className="panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide locations' : 'Show locations'}
        aria-expanded={isExpanded}
        aria-controls="directory-content"
      >
        <span><Icon name="map" /> Browse locations <span className="count-badge">{locations.length}</span></span><Icon name="chevron" />
      </button>

        <div className="panel-content" id="directory-content">
          <div className="location-search-wrap">
            <Icon name="search" width={18} height={18} />
            <label htmlFor="directory-search" className="sr-only">Search locations, studies, or researchers</label>
            <input
              id="directory-search"
              type="search"
              className="location-search"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search studies, people, places…"
            />
          </div>
          <div className="directory-results" role="status"><span>{filteredLocations.length} locations to explore</span>{searchTerm && <button onClick={() => onSearchChange('')}>Clear</button>}</div>

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
                      className={`location-button ${selectedLocationId === location.id ? 'is-selected' : ''}`}
                      aria-pressed={selectedLocationId === location.id}
                      onClick={() => { onLocationSelect?.(location); setIsExpanded(false); }}
                    >
                      <span className="location-name"><Icon name="pin" width={16} height={16} />{location.name}<Icon name="arrow" width={16} height={16} /></span>
                      <span className="location-coords">
                        ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
                      </span>
                      <span className="location-summary">
                        {location.researches.length} {location.researches.length === 1 ? 'study' : 'studies'} · {researcherCount} researcher
                        {researcherCount !== 1 ? 's' : ''}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      <div className="directory-footer"><span className="status-dot" /> Select a location to explore its studies</div>
    </aside>
  );
};
