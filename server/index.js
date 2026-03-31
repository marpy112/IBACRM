require('./loadEnv');
console.log('🔄 Server starting...');
const express = require('express');
const mongoose = require('mongoose');
const { createCorsMiddleware } = require('./corsConfig');

const Admin = require('./models/Admin');
const Location = require('./models/Location');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

console.log('📦 Modules loaded');

// Middleware
app.use(createCorsMiddleware());
app.use(express.json());

// MongoDB Connection
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not defined in .env file');
  console.error('Please create a .env file with: MONGODB_URI=your_connection_string');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Initialize database asynchronously (non-blocking)
    initializeDatabase().catch(err => 
      console.error('Error initializing database:', err.message)
    );
    
    // Start server after connection
    app.listen(PORT, () => {
      console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 Database: MongoDB`);
      console.log('\n✅ Available endpoints:');
      console.log('   POST   /api/auth/login');
      console.log('   POST   /api/auth/signup');
      console.log('   GET    /api/locations');
      console.log('   POST   /api/locations');
      console.log('   DELETE /api/locations/:id');
      console.log('   GET    /api/health\n');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚠️  Starting server anyway on port', PORT);
    app.listen(PORT, () => {
      console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`⚠️  Database: MongoDB (connection failed, will retry)`);
      console.log('\n✅ Available endpoints (may not work):');
      console.log('   POST   /api/auth/login');
      console.log('   POST   /api/auth/signup');
      console.log('   GET    /api/locations');
      console.log('   POST   /api/locations');
      console.log('   DELETE /api/locations/:id');
      console.log('   GET    /api/health\n');
    });
  });

// Initialize database with default data if empty
async function initializeDatabase() {
  const adminCount = await Admin.countDocuments().catch(() => -1);
  const locationCount = await Location.countDocuments().catch(() => -1);

  if (adminCount === 0) {
    await Admin.create({
      email: 'admin@iba.edu.ph',
      password: 'admin123',
    }).catch(err => console.error('Error creating admin:', err.message));
    console.log('✅ Default admin created');
  }

  if (locationCount === 0) {
    const defaultLocations = [
        {
          id: 'davao-city',
          name: 'Davao City Research Hub',
          latitude: 7.0731,
          longitude: 125.6121,
          description: 'Urban ecology and biodiversity research center in Mindanao\'s largest city',
          researchers: ['Dr. Maria Santos', 'Dr. Juan Cruz'],
          radiusKm: 15,
        },
        {
          id: 'mount-apo',
          name: 'Mount Apo Field Station',
          latitude: 6.9919,
          longitude: 125.3631,
          description: 'High-altitude ecosystem research facility on the Philippines\' highest peak',
          researchers: ['Prof. Antonio López', 'Dr. Rosa Garcia'],
          radiusKm: 12,
        },
        {
          id: 'bukidnon',
          name: 'Bukidnon Forest Research Center',
          latitude: 8.4545,
          longitude: 124.8389,
          description: 'Tropical forest biodiversity and reforestation research',
          researchers: ['Dr. Carlos Torres', 'Dr. Ana Reyes'],
          radiusKm: 20,
        },
        {
          id: 'cotabato-wetlands',
          name: 'Cotabato Wetlands Sanctuary',
          latitude: 6.2189,
          longitude: 124.7281,
          description: 'Wetland ecology and migratory bird research station',
          researchers: ['Dr. Miguel Flores', 'Dr. Sofia Mendez'],
          radiusKm: 25,
        },
        {
          id: 'zamboanga-marine',
          name: 'Zamboanga Marine Research Lab',
          latitude: 6.9271,
          longitude: 122.0724,
          description: 'Coastal and marine ecosystem research facility',
          researchers: ['Dr. Ramon Santos', 'Dr. Lisa Gonzalez'],
          radiusKm: 30,
        },
        {
          id: 'misamis-forest',
          name: 'Misamis Oriental Forest Reserve',
          latitude: 8.7533,
          longitude: 124.6431,
          description: 'Protected forest area for biodiversity and climate research',
          researchers: ['Dr. Fernando Perez', 'Dr. Elena Rodriguez'],
          radiusKm: 22,
        },
        {
          id: 'lake-lanao',
          name: 'Lake Lanao Research Center',
          latitude: 8.0,
          longitude: 124.25,
          description: 'Freshwater ecosystem and endemic species research',
          researchers: ['Dr. Vicente Garcia', 'Dr. Maria Cruz'],
          radiusKm: 18,
        },
        {
          id: 'surigao-geological',
          name: 'Surigao Geological Research Station',
          latitude: 9.7624,
          longitude: 125.5047,
          description: 'Geological and mineral resources research center',
          researchers: ['Dr. Roberto Diaz', 'Dr. Paula Martinez'],
          radiusKm: 16,
        },
      ];
      await Location.insertMany(defaultLocations).catch(err => 
        console.error('Error creating locations:', err.message)
      );
      console.log('✅ Default locations created');
    }
}

// ============ AUTH ROUTES ============

// POST /api/auth/login
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

// POST /api/auth/signup
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

// ============ ACCOUNT MANAGEMENT ROUTES ============

// GET /api/admin/accounts
app.get('/api/admin/accounts', async (req, res) => {
  try {
    const accounts = await Admin.find({}, { password: 0 });
    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts: ' + error.message });
  }
});

// POST /api/admin/accounts
app.post('/api/admin/accounts', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
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
      account: { _id: newAdmin._id, email: newAdmin.email, createdAt: newAdmin.createdAt },
      message: 'Account created successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create account: ' + error.message });
  }
});

// DELETE /api/admin/accounts/:id
app.delete('/api/admin/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Admin.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account: ' + error.message });
  }
});

// PUT /api/admin/accounts/:id/password
app.put('/api/admin/accounts/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const admin = await Admin.findByIdAndUpdate(
      id,
      { password: newPassword },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password: ' + error.message });
  }
});

// ============ LOCATION ROUTES ============

// GET /api/locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find();
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations: ' + error.message });
  }
});

// POST /api/locations
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

// DELETE /api/locations/:id
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongodbStatus = mongoose.connection.readyState === 1;
  res.json({
    status: 'Server is running',
    mongodb: mongodbStatus,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

