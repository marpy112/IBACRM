require('./loadEnv');
const mongoose = require('mongoose');

let connectionPromise;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');

  // Reuse an in-flight connection when Vercel serves concurrent requests.
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5,
      bufferCommands: false,
    }).finally(() => {
      connectionPromise = undefined;
    });
  }
  return connectionPromise;
}

module.exports = { connectDatabase };
