require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const Admin = require('./models/Admin');
const Location = require('./models/Location');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware  
app.use(cors());
app.use(express.json());

let isConnected = false;

// Try to connect to MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  }).then(() => {
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  }).catch((err) => {
    console.warn('⚠️  MongoDB connection failed:', err.message);
    console.log('Server will work in read-only mode');
  });
}

// Serve frontend static files (React dist folder)
app.use(express.static(path.join(__dirname, '../dist')));

// ============ AUTH ROUTES ============
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

    res.json({
      success: true,
      email: admin.email,
      message: 'Login successful',
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed: ' + error.message });
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

    res.status(201).json({
      success: true,
      email: newAdmin.email,
      message: 'Account created successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed: ' + error.message });
  }
});

// ============ LOCATION ROUTES ============
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find();
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations: ' + error.message });
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

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
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

    res.status(201).json({
      success: true,
      location: newLocation,
      message: 'Location added successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add location: ' + error.message });
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Location.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete location: ' + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: isConnected, timestamp: new Date() });
});

// Serve React app for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${isConnected ? '✅ MongoDB Connected' : '⚠️  MongoDB Offline'}`);
  console.log(`📁 Frontend: Served from dist/`);
  console.log('\n✅ Available endpoints:');
  console.log('   POST   /api/auth/login');
  console.log('   POST   /api/auth/signup');
  console.log('   GET    /api/locations');
  console.log('   POST   /api/locations');
  console.log('   DELETE /api/locations/:id');
  console.log('   GET    /api/health\n');
});
