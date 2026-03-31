require('./loadEnv');
const express = require('express');
const mongoose = require('mongoose');
const { createCorsMiddleware } = require('./corsConfig');

const Admin = require('./models/Admin');
const Location = require('./models/Location');
const { buildResearchEntry, normalizeLocation, slugify } = require('./locationUtils');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(createCorsMiddleware());
app.use(express.json());

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDefaultLocations() {
  return [
    {
      id: 'davao-city',
      name: 'Davao City Research Hub',
      latitude: 7.0731,
      longitude: 125.6121,
      radiusKm: 15,
      researches: [
        {
          id: 'davao-city-urban-ecology',
          title: 'Urban Ecology and Biodiversity',
          description: 'Urban ecology and biodiversity research center in Mindanao\'s largest city',
          researchers: ['Dr. Maria Santos', 'Dr. Juan Cruz'],
        },
      ],
    },
    {
      id: 'mount-apo',
      name: 'Mount Apo Field Station',
      latitude: 6.9919,
      longitude: 125.3631,
      radiusKm: 12,
      researches: [
        {
          id: 'mount-apo-high-altitude',
          title: 'High-Altitude Ecosystem Study',
          description: 'High-altitude ecosystem research facility on the Philippines\' highest peak',
          researchers: ['Prof. Antonio Lopez', 'Dr. Rosa Garcia'],
        },
      ],
    },
    {
      id: 'bukidnon',
      name: 'Bukidnon Forest Research Center',
      latitude: 8.4545,
      longitude: 124.8389,
      radiusKm: 20,
      researches: [
        {
          id: 'bukidnon-forest-biodiversity',
          title: 'Forest Biodiversity and Reforestation',
          description: 'Tropical forest biodiversity and reforestation research',
          researchers: ['Dr. Carlos Torres', 'Dr. Ana Reyes'],
        },
      ],
    },
    {
      id: 'cotabato-wetlands',
      name: 'Cotabato Wetlands Sanctuary',
      latitude: 6.2189,
      longitude: 124.7281,
      radiusKm: 25,
      researches: [
        {
          id: 'cotabato-wetlands-ecology',
          title: 'Wetland Ecology and Migratory Birds',
          description: 'Wetland ecology and migratory bird research station',
          researchers: ['Dr. Miguel Flores', 'Dr. Sofia Mendez'],
        },
      ],
    },
    {
      id: 'zamboanga-marine',
      name: 'Zamboanga Marine Research Lab',
      latitude: 6.9271,
      longitude: 122.0724,
      radiusKm: 30,
      researches: [
        {
          id: 'zamboanga-marine-ecosystem',
          title: 'Coastal and Marine Ecosystems',
          description: 'Coastal and marine ecosystem research facility',
          researchers: ['Dr. Ramon Santos', 'Dr. Lisa Gonzalez'],
        },
      ],
    },
    {
      id: 'misamis-forest',
      name: 'Misamis Oriental Forest Reserve',
      latitude: 8.7533,
      longitude: 124.6431,
      radiusKm: 22,
      researches: [
        {
          id: 'misamis-climate-biodiversity',
          title: 'Biodiversity and Climate Research',
          description: 'Protected forest area for biodiversity and climate research',
          researchers: ['Dr. Fernando Perez', 'Dr. Elena Rodriguez'],
        },
      ],
    },
    {
      id: 'lake-lanao',
      name: 'Lake Lanao Research Center',
      latitude: 8.0,
      longitude: 124.25,
      radiusKm: 18,
      researches: [
        {
          id: 'lake-lanao-freshwater',
          title: 'Freshwater Ecosystem and Endemic Species',
          description: 'Freshwater ecosystem and endemic species research',
          researchers: ['Dr. Vicente Garcia', 'Dr. Maria Cruz'],
        },
      ],
    },
    {
      id: 'surigao-geological',
      name: 'Surigao Geological Research Station',
      latitude: 9.7624,
      longitude: 125.5047,
      radiusKm: 16,
      researches: [
        {
          id: 'surigao-geological-minerals',
          title: 'Geological and Mineral Resources',
          description: 'Geological and mineral resources research center',
          researchers: ['Dr. Roberto Diaz', 'Dr. Paula Martinez'],
        },
      ],
    },
  ];
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI not defined in .env file');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    initializeDatabase().catch((err) =>
      console.error('Error initializing database:', err.message)
    );

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  });

async function initializeDatabase() {
  const adminCount = await Admin.countDocuments().catch(() => -1);
  const locationCount = await Location.countDocuments().catch(() => -1);

  if (adminCount === 0) {
    await Admin.create({
      email: 'admin@iba.edu.ph',
      password: 'admin123',
    }).catch((err) => console.error('Error creating admin:', err.message));
  }

  if (locationCount === 0) {
    await Location.insertMany(getDefaultLocations()).catch((err) =>
      console.error('Error creating locations:', err.message)
    );
  }
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

app.get('/api/admin/accounts', async (req, res) => {
  try {
    const accounts = await Admin.find({}, { password: 0 });
    return res.json({ success: true, accounts });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch accounts: ' + error.message });
  }
});

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

    return res.status(201).json({
      success: true,
      account: { _id: newAdmin._id, email: newAdmin.email, createdAt: newAdmin.createdAt },
      message: 'Account created successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create account: ' + error.message });
  }
});

app.delete('/api/admin/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Admin.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    return res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete account: ' + error.message });
  }
});

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

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update password: ' + error.message });
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
  const mongodbStatus = mongoose.connection.readyState === 1;
  res.json({
    status: 'Server is running',
    mongodb: mongodbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
