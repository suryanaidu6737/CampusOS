import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI;
  const useMemoryDb = process.env.USE_MEMORY_DB === 'true';

  // 1. Strict Production Enforcement
  if (isProd) {
    if (!mongoUri) {
      console.error('❌ FATAL DATABASE CONFIGURATION ERROR: MONGODB_URI environment variable is missing in production mode.');
      throw new Error('FATAL: MONGODB_URI is strictly required when NODE_ENV=production. MongoMemoryServer is disabled in production.');
    }
    try {
      console.log('Connecting to Production MongoDB Database...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected successfully to host: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.error(`❌ Production MongoDB Connection Failure: ${err.message}`);
      throw new Error(`Production MongoDB Connection Failed: ${err.message}`);
    }
  }

  // 2. Development Mode Connection
  if (mongoUri) {
    try {
      console.log('Connecting to Primary MongoDB Database...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`MongoDB Connected successfully to host: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.warn(`Primary MongoDB Connection Notice: ${err.message}`);
    }
  }

  // 3. Fallback to MongoMemoryServer only if explicitly allowed via USE_MEMORY_DB=true
  if (useMemoryDb) {
    console.log('USE_MEMORY_DB=true detected. Initializing embedded MongoMemoryServer for development...');
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Embedded MongoMemoryServer connected successfully at ${memoryUri}`);
      return;
    } catch (memErr) {
      console.error(`Failed to start MongoMemoryServer: ${memErr.message}`);
      throw memErr;
    }
  }

  // If MONGODB_URI failed or absent and USE_MEMORY_DB is false, fail fast!
  console.error('❌ FATAL: Database connection failed. MONGODB_URI is missing or unreachable, and USE_MEMORY_DB is false.');
  throw new Error('FATAL: No database available. Set a valid MONGODB_URI or set USE_MEMORY_DB=true for local testing.');
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

