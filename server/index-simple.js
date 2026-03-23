require('./loadEnv');
const express = require('express');
const mongoose = require('mongoose');
const { createCorsMiddleware } = require('./corsConfig');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware  
app.use(createCorsMiddleware());
app.use(express.json());

let isConnected = false;

// Try to connect to MongoDB (don't block server startup)
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

// Mock data for testing
const MOCK_LOCATIONS = [
  {
    id: 'davao-city',
    name: 'Davao City Research Hub',
    latitude: 7.0731,
    longitude: 125.6121,
    description: 'Urban ecology and biodiversity research center',
    researchers: ['Dr. Maria Santos'],
    radiusKm: 15,
  }
];

// ============ AUTH ROUTES ============
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

// ============ LOCATION ROUTES ============
app.get('/api/locations', (req, res) => {
  res.json({ success: true, locations: MOCK_LOCATIONS });
});

app.post('/api/locations', (req, res) => {
  try {
    const { name, latitude, longitude, description, researcher1, researcher2, radiusKm } = req.body;

    // Validation
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

    // Create location object
    const newLocation = {
      id: `location-${Date.now()}`,
      name,
      latitude: lat,
      longitude: lng,
      description,
      researchers: [researcher1, ...(researcher2 ? [researcher2] : [])],
      radiusKm: radius,
    };

    // Add to mock data (persists in memory during server runtime)
    MOCK_LOCATIONS.push(newLocation);

    res.status(201).json({
      success: true,
      location: newLocation,
      message: 'Location added successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add location: ' + error.message });
  }
});

app.delete('/api/locations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = MOCK_LOCATIONS.length;
    
    // Filter out the location
    const updatedLocations = MOCK_LOCATIONS.filter(loc => loc.id !== id);
    
    if (updatedLocations.length === initialLength) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Update the array
    MOCK_LOCATIONS.length = 0;
    MOCK_LOCATIONS.push(...updatedLocations);

    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete location: ' + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: isConnected });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${isConnected ? '✅ MongoDB Connected' : '⚠️  MongoDB Offline (fallback mode)'}`);
  console.log('\n✅ Available endpoints:');
  console.log('   POST   /api/auth/login');
  console.log('   POST   /api/auth/signup');
  console.log('   GET    /api/locations');
  console.log('   POST   /api/locations');
  console.log('   DELETE /api/locations/:id');
  console.log('   GET    /api/health\n');
});
