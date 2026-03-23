/**
 * Migration Script: Import JSON data to MongoDB
 * 
 * Usage: node migrate.js
 * 
 * This script reads from data/admins.json and data/locations.json
 * and imports them into MongoDB. It skips duplicates.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Admin = require('./models/Admin');
const Location = require('./models/Location');

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = path.join(__dirname, 'data');
const adminsFile = path.join(DATA_DIR, 'admins.json');
const locationsFile = path.join(DATA_DIR, 'locations.json');

async function migrate() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Migrate Admins
    console.log('📋 Migrating admins...');
    if (fs.existsSync(adminsFile)) {
      const adminsData = JSON.parse(fs.readFileSync(adminsFile, 'utf-8'));
      let importedCount = 0;
      let skippedCount = 0;

      for (const admin of adminsData) {
        const exists = await Admin.findOne({ email: admin.email });
        if (!exists) {
          await Admin.create({
            email: admin.email,
            password: admin.password,
          });
          importedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log(`   ✅ Imported: ${importedCount} admins`);
      if (skippedCount > 0) {
        console.log(`   ⏭️  Skipped: ${skippedCount} duplicates\n`);
      }
    } else {
      console.log('   ℹ️  No admins.json file found - skipping\n');
    }

    // Migrate Locations
    console.log('🗺️  Migrating locations...');
    if (fs.existsSync(locationsFile)) {
      const locationsData = JSON.parse(fs.readFileSync(locationsFile, 'utf-8'));
      let importedCount = 0;
      let skippedCount = 0;

      for (const location of locationsData) {
        const exists = await Location.findOne({ id: location.id });
        if (!exists) {
          await Location.create(location);
          importedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log(`   ✅ Imported: ${importedCount} locations`);
      if (skippedCount > 0) {
        console.log(`   ⏭️  Skipped: ${skippedCount} duplicates\n`);
      }
    } else {
      console.log('   ℹ️  No locations.json file found - skipping\n');
    }

    console.log('✨ Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm start');
    console.log('   2. Your data is now in MongoDB\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run migration
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not defined in .env file');
  process.exit(1);
}

migrate();
