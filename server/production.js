require('./loadEnv');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createCorsMiddleware } = require('./corsConfig');

const Admin = require('./models/Admin');
const Location = require('./models/Location');

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
    return res.json({ success: true, locations });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch locations: ' + error.message });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const { name, latitude, longitude, description, researcher1, researcher2, radiusKm } = req.body;

    if (!name || latitude === undefined || longitude === undefined || !description || !researcher1) {
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

    const newLocation = await Location.create({
      id: `location-${Date.now()}`,
      name,
      latitude: lat,
      longitude: lng,
      description,
      researchers: [researcher1, ...(researcher2 ? [researcher2] : [])],
      radiusKm: radius,
    });

    return res.status(201).json({
      success: true,
      location: newLocation,
      message: 'Location added successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add location: ' + error.message });
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
