require('./loadEnv');
const express = require('express');
const mongoose = require('mongoose');
const { createCorsMiddleware } = require('./corsConfig');
const { buildResearchEntry, normalizeLocation, slugify } = require('./locationUtils');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(createCorsMiddleware());
app.use(express.json());

let isConnected = false;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  }).then(() => {
    isConnected = true;
    console.log('Connected to MongoDB');
  }).catch((err) => {
    console.warn('MongoDB connection failed:', err.message);
    console.log('Server will work in read-only mode');
  });
}

const MOCK_LOCATIONS = [
  {
    id: 'davao-city',
    name: 'Davao City Research Hub',
    latitude: 7.0731,
    longitude: 125.6121,
    radiusKm: 15,
    researches: [
      {
        id: 'davao-urban-ecology',
        title: 'Urban Ecology and Biodiversity',
        description: 'Urban ecology and biodiversity research center',
        researchers: ['Dr. Maria Santos'],
      },
    ],
  },
];

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@iba.edu.ph' && password === 'admin123') {
    res.json({ success: true, email, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  res.status(201).json({ success: true, message: 'Signup not available' });
});

app.get('/api/locations', (req, res) => {
  res.json({ success: true, locations: MOCK_LOCATIONS.map(normalizeLocation) });
});

app.post('/api/locations', (req, res) => {
  try {
    const { name, latitude, longitude, radiusKm } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(radiusKm || 15);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return res.status(400).json({ error: 'Invalid coordinate or radius values' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const trimmedName = String(name).trim();
    const existingLocation = MOCK_LOCATIONS.find(
      (location) => location.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingLocation) {
      return res.status(400).json({ error: 'Location already exists' });
    }

    const location = {
      id: `${slugify(trimmedName) || 'location'}-${Date.now()}`,
      name: trimmedName,
      latitude: lat,
      longitude: lng,
      radiusKm: radius,
      researches: [],
    };

    MOCK_LOCATIONS.push(location);

    res.status(201).json({
      success: true,
      location: normalizeLocation(location),
      message: 'Location added successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add location: ' + error.message });
  }
});

app.post('/api/locations/researches', (req, res) => {
  try {
    const { title, description, researchers, locationIds } = req.body;

    if (!title || !description || !Array.isArray(researchers) || !Array.isArray(locationIds)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanedResearchers = researchers
      .map((item) => ({
        name: String(item?.name || '').trim(),
        degree: String(item?.degree || '').trim(),
      }))
      .filter((item) => item.name);
    const cleanedLocationIds = locationIds.map((item) => String(item).trim()).filter(Boolean);

    if (cleanedResearchers.length === 0 || cleanedLocationIds.length === 0) {
      return res.status(400).json({ error: 'At least one researcher and one location are required' });
    }

    const locations = MOCK_LOCATIONS.filter((entry) => cleanedLocationIds.includes(entry.id));
    if (locations.length !== cleanedLocationIds.length) {
      return res.status(404).json({ error: 'One or more locations were not found' });
    }

    const researchEntry = buildResearchEntry({
      title,
      description,
      researchers: cleanedResearchers,
      locationIds: cleanedLocationIds,
      id: `research-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });

    const savedLocations = locations.map((location) => {
      location.researches = [...(location.researches || []), researchEntry];
      return normalizeLocation(location);
    });

    res.status(201).json({
      success: true,
      locations: savedLocations,
      message: 'Research added successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add research: ' + error.message });
  }
});

app.delete('/api/locations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = MOCK_LOCATIONS.length;
    const updatedLocations = MOCK_LOCATIONS.filter((loc) => loc.id !== id);

    if (updatedLocations.length === initialLength) {
      return res.status(404).json({ error: 'Location not found' });
    }

    MOCK_LOCATIONS.length = 0;
    MOCK_LOCATIONS.push(...updatedLocations);

    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete location: ' + error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: isConnected });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
