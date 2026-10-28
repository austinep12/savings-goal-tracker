const mongoose = require('mongoose');

let memoryServerInstance = null;

/**
 * Connect to MongoDB with graceful fallback to in-memory server if local MongoDB is not running.
 */
const connectDB = async () => {
  // If connection is already established (e.g. in serverless warm starts), reuse it
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/savings-tracker';

  try {
    // Attempt connecting to configured URI (Atlas or local MongoDB)
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s for Atlas cloud connection
      bufferCommands: false // Disable buffering so errors surface immediately if disconnected
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to primary URI: ${err.message}`);

    // On Vercel / Production, do not attempt in-memory fallback
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw err;
    }
    try {
      console.log('[MongoDB] Attempting to start in-memory MongoDB fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memUri = memoryServerInstance.getUri();

      const conn = await mongoose.connect(memUri);
      console.log(`[MongoDB] Connected to in-memory MongoDB at: ${memUri}`);
      console.log('[MongoDB] NOTE: In-memory mode active. Data is persisted during runtime. Provide MONGO_URI in .env for persistent storage.');
      return conn;
    } catch (fallbackErr) {
      console.error('[MongoDB] In-memory fallback failed or package unavailable:', fallbackErr.message);
      console.error('[MongoDB] Please ensure MongoDB is running locally or specify a valid MONGO_URI in .env (e.g., MongoDB Atlas).');
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
