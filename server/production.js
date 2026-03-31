require('./loadEnv');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createCorsMiddleware } = require('./corsConfig');

const Admin = require('./models/Admin');
const Location = require('./models/Location');
const { buildResearchEntry, normalizeLocation, slugify } = require('./locationUtils');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
const MONGODB_URI = process.env.MONGODB_URI;
const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const hasFrontendBuild = fs.existsSync(indexHtmlPath);

app.use(createCorsMiddleware());
app.use(express.json());

let isConnected = false;

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      isConnected = true;
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.warn('MongoDB connection failed:', err.message);
      console.log('Server will continue without a database connection');
    });
}

if (hasFrontendBuild) {
  app.use(express.static(distDir));
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email, password });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({
      success: true,
      email: admin.email,
      message: 'Login successful',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newAdmin = await Admin.create({ email, password });

    return res.status(201).json({
      success: true,
      email: newAdmin.email,
      message: 'Account created successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Signup failed: ' + error.message });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find();
    return res.json({ success: true, locations: locations.map(normalizeLocation) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch locations: ' + error.message });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const { name, latitude, longitude, radiusKm } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(radiusKm || 15);

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
      return res.status(400).json({ error: 'Invalid coordinate or radius values' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const trimmedName = String(name).trim();
    const existingLocation = await Location.findOne({
      name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: 'i' },
    });

    if (existingLocation) {
      return res.status(400).json({ error: 'Location already exists' });
    }

    const savedLocation = await Location.create({
      id: `${slugify(trimmedName) || 'location'}-${Date.now()}`,
      name: trimmedName,
      latitude: lat,
      longitude: lng,
      radiusKm: radius,
      researches: [],
      description: '',
      researchers: [],
    });

    return res.status(201).json({
      success: true,
      location: normalizeLocation(savedLocation),
      message: 'Location added successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add location: ' + error.message });
  }
});

app.post('/api/locations/researches', async (req, res) => {
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

    const locations = await Location.find({ id: { $in: cleanedLocationIds } });
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

    const savedLocations = [];

    for (const location of locations) {
      const normalized = normalizeLocation(location);
      location.researches = [...normalized.researches, researchEntry];
      location.description = '';
      location.researchers = [];
      const savedLocation = await location.save();
      savedLocations.push(normalizeLocation(savedLocation));
    }

    return res.status(201).json({
      success: true,
      locations: savedLocations,
      message: 'Research added successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add research: ' + error.message });
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Location.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    return res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete location: ' + error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: isConnected,
    frontend: hasFrontendBuild,
    timestamp: new Date().toISOString(),
  });
});

if (hasFrontendBuild) {
  app.get('*', (req, res) => {
    res.sendFile(indexHtmlPath);
  });
}

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
  console.log(`Database status: ${isConnected ? 'connected' : 'offline'}`);
  console.log(`Frontend status: ${hasFrontendBuild ? 'serving dist build' : 'backend only'}`);
});
