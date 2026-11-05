import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { addLocation, addResearchToLocations, deleteLocation } from '../services/api';
import MapPicker from './MapPicker';
import AccountManagement from './AccountManagement';
import type { ResearchLocation, ResearcherEntry } from '../types/research';
import { exportResearchMap, exportResearchMapJpg } from '../utils/researchExport';
import './AdminDashboard.css';

interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
  locations: ResearchLocation[];
  onAddLocation: (location: ResearchLocation) => void;
  onDeleteLocation: (id: string) => void;
  mapboxAccessToken: string;
}

interface LocationFormState {
  name: string;
  latitude: string;
  longitude: string;
  radiusKm: string;
}

interface ResearchFormState {
  locationIds: string[];
  title: string;
  description: string;
  researchers: ResearcherEntry[];
}

const EMPTY_LOCATION_FORM: LocationFormState = {
  name: '',
  latitude: '',
  longitude: '',
  radiusKm: '',
};

const EMPTY_RESEARCH_FORM: ResearchFormState = {
  locationIds: [],
  title: '',
  description: '',
  researchers: [
    { name: '', degree: '' },
    { name: '', degree: '' },
  ],
};

export default function AdminDashboard({
  onLogout,
  adminEmail,
  locations,
  onAddLocation,
  onDeleteLocation,
  mapboxAccessToken,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'locations' | 'accounts'>('locations');
  const [editorTab, setEditorTab] = useState<'location' | 'study'>('location');
  const studies = useMemo(() => [...new Map(locations.flatMap((location) => location.researches).map((research) => [research.id, research])).values()], [locations]);
  const researcherCount = new Set(studies.flatMap((research) => research.researchers.map((researcher) => researcher.name.trim().toLowerCase()))).size;
  const [locationForm, setLocationForm] = useState<LocationFormState>(EMPTY_LOCATION_FORM);
  const [researchForm, setResearchForm] = useState<ResearchFormState>(EMPTY_RESEARCH_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studySearch, setStudySearch] = useState('');
  const [exportingJpg, setExportingJpg] = useState(false);
  const studyQuery = studySearch.trim().toLowerCase();
  const visibleLocations = useMemo(() => locations.map((location) => ({
    location,
    studies: location.researches.filter((research) =>
      `${location.name} ${research.title} ${research.description} ${research.researchers
        .map((researcher) => `${researcher.name} ${researcher.degree}`)
        .join(' ')}`.toLowerCase().includes(studyQuery)
    ),
  })).filter(({ studies }) => !studyQuery || studies.length > 0), [locations, studyQuery]);

  const selectedLocationNames = useMemo(
    () =>
      locations
        .filter((location) => researchForm.locationIds.includes(location.id))
        .map((location) => location.name),
    [locations, researchForm.locationIds]
  );

  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLocationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setResearchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSelectionChange = (locationId: string) => {
    setResearchForm((prev) => ({
      ...prev,
      locationIds: prev.locationIds.includes(locationId)
        ? prev.locationIds.filter((id) => id !== locationId)
        : [...prev.locationIds, locationId],
    }));
  };

  const handleResearcherChange = (index: number, field: keyof ResearcherEntry, value: string) => {
    setResearchForm((prev) => ({
      ...prev,
      researchers: prev.researchers.map((researcher, currentIndex) =>
        currentIndex === index ? { ...researcher, [field]: value } : researcher
      ),
    }));
  };

  const addResearcherField = () => {
    setResearchForm((prev) => ({
      ...prev,
      researchers: [...prev.researchers, { name: '', degree: '' }],
    }));
  };

  const removeResearcherField = (index: number) => {
    setResearchForm((prev) => {
      if (prev.researchers.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        researchers: prev.researchers.filter((_, currentIndex) => currentIndex !== index),
      };
    });
  };

  const handleCoordinatesChange = (latitude: number, longitude: number) => {
    setLocationForm((prev) => ({
      ...prev,
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLocation(id);
      onDeleteLocation(id);
      setSuccess('Location deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location');
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!locationForm.name || !locationForm.latitude || !locationForm.longitude) {
      setError('Please fill in the location name and coordinates.');
      return;
    }

    const lat = parseFloat(locationForm.latitude);
    const lng = parseFloat(locationForm.longitude);
    const radius = parseFloat(locationForm.radiusKm || '15');

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
      setError('Latitude, longitude, and radius must be valid numbers.');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90.');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180.');
      return;
    }

    try {
      const result = await addLocation({
        name: locationForm.name.trim(),
        latitude: lat,
        longitude: lng,
        radiusKm: radius,
      });

      onAddLocation(result.location);
      setSuccess(`Location "${result.location.name}" created successfully!`);
      setLocationForm(EMPTY_LOCATION_FORM);
      setResearchForm((prev) => ({
        ...prev,
        locationIds: prev.locationIds.length > 0 ? prev.locationIds : [result.location.id],
      }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add location');
    }
  };

  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (researchForm.locationIds.length === 0 || !researchForm.title || !researchForm.description) {
      setError('Please select at least one location, plus a research title and description.');
      return;
    }

    const cleanedResearchers = researchForm.researchers
      .map((item) => ({
        name: item.name.trim(),
        degree: item.degree.trim(),
      }))
      .filter((item) => item.name);
    if (cleanedResearchers.length === 0) {
      setError('Please add at least one researcher.');
      return;
    }

    try {
      const result = await addResearchToLocations(researchForm.locationIds, {
        title: researchForm.title.trim(),
        description: researchForm.description.trim(),
        researchers: cleanedResearchers,
      });

      result.locations.forEach((location: ResearchLocation) => {
        onAddLocation(location);
      });

      setSuccess(`Research added to ${result.locations.length} location${result.locations.length !== 1 ? 's' : ''} successfully!`);
      setResearchForm((prev) => ({
        ...EMPTY_RESEARCH_FORM,
        locationIds: prev.locationIds,
      }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add research');
    }
  };

  const handleExportJpg = async (location: ResearchLocation, research: ResearchLocation['researches'][number], view: '2d' | '3d') => {
    if (exportingJpg) return;
    setExportingJpg(true);
    setError('');
    setSuccess('');
    try {
      await exportResearchMapJpg(research, location, locations, mapboxAccessToken, view);
      setSuccess(`HD JPG download started for "${research.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export JPG');
    } finally {
      setExportingJpg(false);
    }
  };

  const handleExportResearch = (location: ResearchLocation, research: ResearchLocation['researches'][number], view: '2d' | '3d') => {
    setError('');
    setSuccess('');

    try {
      exportResearchMap(research, location, locations, mapboxAccessToken, view);
      setSuccess(`Export preview opened for "${research.title}".`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export research map');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <p className="eyebrow">Administration</p>
          <h1>{activeTab === 'locations' ? 'Research workspace' : 'Account management'}</h1>
        </div>
        <div className="admin-profile"><span className="profile-avatar">{adminEmail.charAt(0).toUpperCase()}</span><div><strong>Administrator</strong><p className="admin-email">{adminEmail}</p></div></div>
      </div>

      <nav className="admin-tabs" aria-label="Admin navigation">
        <Link to="/" className="admin-brand"><img src="/iba-logo.png" alt="IBA College of Mindanao" /><span>Research Atlas<small>IBA College of Mindanao</small></span></Link>
        <p className="nav-label">Workspace</p>
        <button
          className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
          aria-current={activeTab === 'locations' ? 'page' : undefined}
        >
          <Icon name="book" /> Research & locations
        </button>
        <button
          className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
          aria-current={activeTab === 'accounts' ? 'page' : undefined}
        >
          <Icon name="users" /> User management
        </button>
        <div className="admin-nav-footer">
          <Link to="/" className="tab-button"><Icon name="map" /> View public map <Icon name="arrow" width={16} height={16} /></Link>
          <button onClick={onLogout} className="tab-button"><Icon name="logout" /> Sign out</button>
          <p>Knowledge connected to place.</p>
        </div>
      </nav>

      <div className="admin-container">
        {activeTab === 'locations' && <>
          <div className="workspace-intro"><div><h2>Your research, at a glance.</h2><p>Manage study locations, connect researchers, and share your findings.</p></div><Link to="/" className="text-link">Explore the map <Icon name="arrow" width={16} height={16} /></Link></div>
          <div className="admin-stats">
            <div><span className="stat-icon"><Icon name="pin" /></span><p>Research locations<strong>{locations.length}</strong></p><span className="stat-caption">Across the map</span></div>
            <div><span className="stat-icon"><Icon name="book" /></span><p>Registered studies<strong>{studies.length}</strong></p><span className="stat-caption">In your collection</span></div>
            <div><span className="stat-icon"><Icon name="users" /></span><p>Researchers<strong>{researcherCount}</strong></p><span className="stat-caption">Contributing knowledge</span></div>
          </div>
        </>}
        {error && <div className="admin-error" role="alert">{error}</div>}
        {success && <div className="admin-success" role="status">{success}</div>}
        {activeTab === 'locations' && (
          <div className="tab-content">
            <div className="add-location-section">
              <div className="editor-tabs" aria-label="Choose what to add">
                <button className={editorTab === 'location' ? 'active' : ''} onClick={() => setEditorTab('location')} aria-pressed={editorTab === 'location'}><Icon name="pin" width={16} height={16} /> Add location</button>
                <button className={editorTab === 'study' ? 'active' : ''} onClick={() => setEditorTab('study')} aria-pressed={editorTab === 'study'}><Icon name="plus" width={16} height={16} /> Add study</button>
              </div>
              <div hidden={editorTab !== 'location'}>
              <h2>A new point of discovery</h2>
              <p className="section-description">Pin a location on the map, then add its details.</p>

              <MapPicker
                latitude={locationForm.latitude}
                longitude={locationForm.longitude}
                onCoordinatesChange={handleCoordinatesChange}
                accessToken={mapboxAccessToken}
              />

              <form onSubmit={handleLocationSubmit} className="admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Location Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={locationForm.name}
                      onChange={handleLocationInputChange}
                      placeholder="e.g., Valencia City"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="radiusKm">Research Area Radius (km) *</label>
                    <input
                      type="number"
                      id="radiusKm"
                      name="radiusKm"
                      value={locationForm.radiusKm}
                      onChange={handleLocationInputChange}
                      placeholder="e.g., 15"
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="latitude">Latitude *</label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={locationForm.latitude}
                      onChange={handleLocationInputChange}
                      placeholder="e.g., 7.9037"
                      step="0.0001"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="longitude">Longitude *</label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={locationForm.longitude}
                      onChange={handleLocationInputChange}
                      placeholder="e.g., 125.0928"
                      step="0.0001"
                    />
                  </div>
                </div>

                <button type="submit" className="submit-button">
                  Create Location
                </button>
              </form>
              </div>

              <div className="admin-form form-section-gap" hidden={editorTab !== 'study'}>
                <h2>Add to the collection</h2>
                <p className="section-description">Connect a study to one or more research locations.</p>
                <form onSubmit={handleResearchSubmit}>
                  <div className="form-group">
                    <label>Choose One or More Locations *</label>
                    <div className="location-selector-list">
                      {locations.length === 0 ? (
                        <p className="form-hint">Create a location first before adding research.</p>
                      ) : (
                        locations.map((location) => (
                          <label key={location.id} className="location-selector-item">
                            <input
                              type="checkbox"
                              checked={researchForm.locationIds.includes(location.id)}
                              onChange={() => handleLocationSelectionChange(location.id)}
                            />
                            <span>{location.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedLocationNames.length > 0 && (
                      <p className="form-hint">
                        Selected: {selectedLocationNames.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="title">Research Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={researchForm.title}
                      onChange={handleResearchInputChange}
                      placeholder="e.g., Watershed Quality Assessment"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Research Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      value={researchForm.description}
                      onChange={handleResearchInputChange}
                      placeholder="Describe the research registered in these locations..."
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <div className="researchers-header">
                      <label>Researchers *</label>
                      <button type="button" className="secondary-button" onClick={addResearcherField}>
                        Add Researcher
                      </button>
                    </div>

                    <div className="researchers-stack">
                      {researchForm.researchers.map((researcher, index) => (
                        <div className="researcher-row" key={`researcher-${index}`}>
                          <input
                            type="text"
                            aria-label={`Researcher ${index + 1} name`}
                            value={researcher.name}
                            onChange={(event) => handleResearcherChange(index, 'name', event.target.value)}
                            placeholder={`Researcher ${index + 1} name`}
                          />
                          <input
                            type="text"
                            aria-label={`Researcher ${index + 1} degree`}
                            value={researcher.degree}
                            onChange={(event) => handleResearcherChange(index, 'degree', event.target.value)}
                            placeholder="Degree"
                          />
                          {researchForm.researchers.length > 1 && (
                            <button
                              type="button"
                              className="remove-button"
                              onClick={() => removeResearcherField(index)}
                              aria-label={`Remove researcher ${index + 1}`}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="submit-button" disabled={locations.length === 0}>
                    Add Research to Selected Locations
                  </button>
                </form>
              </div>
            </div>

            <div className="locations-list-section">
              <div className="collection-heading"><div><p className="eyebrow">Your collection</p><h2>Research locations</h2></div><span className="count-badge">{locations.length} locations</span></div>
              <div className="form-group study-search">
                <label htmlFor="admin-study-search">Search studies</label>
                <input
                  id="admin-study-search"
                  type="search"
                  value={studySearch}
                  onChange={(event) => setStudySearch(event.target.value)}
                  placeholder="Title, description, researcher, or location"
                />
                {studySearch && (
                  <button type="button" className="secondary-button" onClick={() => setStudySearch('')}>
                    Clear search
                  </button>
                )}
              </div>
              <p className="form-hint" role="status">
                {studyQuery && `${visibleLocations.reduce((count, { studies }) => count + studies.length, 0)} matching study entries across ${visibleLocations.length} locations`}
              </p>

              {locations.length === 0 ? (
                <p className="no-locations">No locations added yet. Add one using the form above.</p>
              ) : visibleLocations.length === 0 ? (
                <p className="no-locations">No studies match your search. Try another keyword.</p>
              ) : (
                <div className="locations-grid">
                  {visibleLocations.map(({ location, studies }) => (
                    <div key={location.id} className="location-card">
                      <div className="location-card-header">
                        <div>
                          <h3>{location.name || 'Unnamed Location'}</h3>
                          <p className="location-meta">
                            {location.researches.length} research
                            {location.researches.length !== 1 ? 'es' : ''} registered
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="delete-button"
                          title="Delete location"
                          aria-label={`Delete ${location.name}`}
                        >
                          x
                        </button>
                      </div>

                      <div className="location-details">
                        <p>
                          <strong>Coordinates:</strong> {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
                        </p>
                        <p>
                          <strong>Radius:</strong> {location.radiusKm} km
                        </p>
                      </div>

                      <div className="research-list">
                        {studies.map((research) => (
                          <article key={`${location.id}-${research.id}`} className="research-card">
                            <div className="research-card-header">
                              <h4>{research.title}</h4>
                              <div className="export-actions">
                              {(['2d', '3d'] as const).map((view) => (
                              <div className="export-actions" key={view}>
                              <button
                                type="button"
                                className="export-button"
                                onClick={() => handleExportResearch(location, research, view)}
                              >
                                {view === '3d' ? '3D (Tilt)' : '2D'} PDF
                              </button>
                              <button
                                type="button"
                                className="export-button"
                                disabled={exportingJpg}
                                onClick={() => handleExportJpg(location, research, view)}
                                title="Download only the map as a 2560 × 1440 JPG"
                              >
                                {exportingJpg ? 'Rendering JPG…' : `${view === '3d' ? '3D (Tilt)' : '2D'} JPG (HD)`}
                              </button>
                              </div>
                              ))}
                              </div>
                            </div>
                            <p>{research.description}</p>
                            <p>
                              <strong>Researchers:</strong>{' '}
                              {research.researchers
                                .map((researcher) =>
                                  researcher.degree ? `${researcher.name}, ${researcher.degree}` : researcher.name
                                )
                                .join(', ')}
                            </p>
                            {research.locationIds && research.locationIds.length > 1 && (
                              <p>
                                <strong>Linked locations:</strong> {research.locationIds.length}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="tab-content accounts-content">
            <AccountManagement />
          </div>
        )}
      </div>
    </div>
  );
}
