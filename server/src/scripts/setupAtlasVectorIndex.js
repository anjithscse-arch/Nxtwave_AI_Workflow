import mongoose from 'mongoose';
import config from '../config/env.js';

async function setupVectorIndex() {
  console.log('Connecting to MongoDB Atlas at:', config.mongodbUri.replace(/:([^@]+)@/, ':****@'));
  await mongoose.connect(config.mongodbUri);
  const db = mongoose.connection.db;

  const chunksCollection = db.collection('chunks');

  // Define vector search index
  const indexDefinition = {
    name: 'vector_index',
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 3072,
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'docId'
        }
      ]
    }
  };

  try {
    console.log('Attempting to create Atlas Search/Vector Index programmatically...');
    const result = await chunksCollection.createSearchIndex(indexDefinition);
    console.log('✅ Atlas Vector Index created successfully:', result);
  } catch (err) {
    console.log('ℹ️ Programmatic index creation info:', err.message);
  }

  try {
    const indexes = await chunksCollection.listSearchIndexes().toArray();
    console.log('📋 Current Atlas Search Indexes on chunks collection:', indexes);
  } catch (err) {
    console.log('ℹ️ List search indexes info:', err.message);
  }

  await mongoose.disconnect();
}

setupVectorIndex();
