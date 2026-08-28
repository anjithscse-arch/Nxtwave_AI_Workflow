import mongoose from 'mongoose';
import config from './env.js';

let mongoMemoryServer = null;

export async function connectDB() {
  try {
    let uri = config.mongodbUri;

    if (!uri) {
      console.warn('\n' + '!'.repeat(70));
      console.warn('⚠️  WARNING: [DEVELOPMENT / DEMO MODE ONLY]');
      console.warn('⚠️  No MONGODB_URI configured. Starting embedded in-memory MongoDB.');
      console.warn('⚠️  DATA PERSISTENCE WARNING: All data (users, docs, chunks, logs)');
      console.warn('⚠️  will be WIPED when this server process terminates or restarts!');
      console.warn('⚠️  For production, set MONGODB_URI in .env to a MongoDB Atlas cluster.');
      console.warn('!'.repeat(70) + '\n');
      
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      console.log(`✅ Embedded In-Memory MongoDB Server running at: ${uri}`);
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`🚀 Connected to MongoDB (${mongoose.connection.host || 'in-memory'})`);
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    if (!mongoMemoryServer) {
      console.log('⚠️ Attempting fallback to in-memory MongoDB...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const fallbackUri = mongoMemoryServer.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`✅ Fallback Embedded MongoDB active at: ${fallbackUri}`);
        return mongoose.connection;
      } catch (innerError) {
        console.error('❌ Failed to start fallback MongoDB:', innerError);
        throw innerError;
      }
    }
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
