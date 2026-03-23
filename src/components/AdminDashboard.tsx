import { useState } from 'react';
import { addLocation, deleteLocation } from '../services/api';
import MapPicker from './MapPicker';
import './AdminDashboard.css';

export interface ResearchLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  researchers: string[];
  radiusKm: number;
}

interface AdminDashboardProps {
  onLogout: () => void;
  adminEmail: string;
  locations: ResearchLocation[];
  onAddLocation: (location: ResearchLocation) => void;
  onDeleteLocation: (id: string) => void;
  mapboxAccessToken: string;
}

export default function AdminDashboard({
  onLogout,
  adminEmail,
  locations,
  onAddLocation,
  onDeleteLocation,
  mapboxAccessToken,
}: AdminDashboardProps) {
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    description: '',
    researcher1: '',
    researcher2: '',
    radiusKm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCoordinatesChange = (latitude: number, longitude: number) => {
    setFormData((prev) => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.latitude || !formData.longitude || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.researcher1) {
      setError('Please add at least one researcher');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const radius = parseFloat(formData.radiusKm || '15');

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      setError('Latitude, longitude, and radius must be valid numbers');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    try {
      const result = await addLocation({
        name: formData.name,
        latitude: lat,
        longitude: lng,
        description: formData.description,
        researcher1: formData.researcher1,
        researcher2: formData.researcher2 || undefined,
        radiusKm: radius,
      });

      onAddLocation(result.location);
      setSuccess(`Location "${formData.name}" added successfully!`);
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        description: '',
        researcher1: '',
        researcher2: '',
        radiusKm: '',
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add location');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <p className="admin-email">Logged in as: {adminEmail}</p>
        </div>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="admin-container">
        <div className="add-location-section">
          <h2>Add New Research Location</h2>

          {error && <div className="admin-error">{error}</div>}
          {success && <div className="admin-success">{success}</div>}

          <MapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onCoordinatesChange={handleCoordinatesChange}
            accessToken={mapboxAccessToken}
          />

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Location Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mount Apo Research Center"
                />
              </div>

              <div className="form-group">
                <label htmlFor="radiusKm">Research Area Radius (km) *</label>
                <input
                  type="number"
                  id="radiusKm"
                  name="radiusKm"
                  value={formData.radiusKm}
                  onChange={handleInputChange}
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
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 6.9919"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude *</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 125.3631"
                  step="0.0001"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the research location and its significance..."
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="researcher1">Primary Researcher *</label>
                <input
                  type="text"
                  id="researcher1"
                  name="researcher1"
                  value={formData.researcher1}
                  onChange={handleInputChange}
                  placeholder="e.g., Dr. Maria Santos"
                />
              </div>

              <div className="form-group">
                <label htmlFor="researcher2">Secondary Researcher</label>
                <input
                  type="text"
                  id="researcher2"
                  name="researcher2"
                  value={formData.researcher2}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            <button type="submit" className="submit-button">
              Add Location
            </button>
          </form>
        </div>

        <div className="locations-list-section">
          <h2>Research Locations ({locations.length})</h2>

          {locations.length === 0 ? (
            <p className="no-locations">No locations added yet. Add one using the form above.</p>
          ) : (
            <div className="locations-grid">
              {locations.map((location) => (
                <div key={location.id} className="location-card">
                  <div className="location-card-header">
                    <h3>{location.name || 'Unnamed Location'}</h3>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="delete-button"
                      title="Delete location"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="location-details">
                    <p>
                      <strong>Coordinates:</strong> {location.latitude ? location.latitude.toFixed(4) : 'N/A'}°N,{' '}
                      {location.longitude ? location.longitude.toFixed(4) : 'N/A'}°E
                    </p>
                    <p>
                      <strong>Radius:</strong> {location.radiusKm || 'N/A'} km
                    </p>
                    <p>
                      <strong>Description:</strong> {location.description || 'N/A'}
                    </p>
                    <p>
                      <strong>Researchers:</strong> {location.researchers ? location.researchers.join(', ') : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
