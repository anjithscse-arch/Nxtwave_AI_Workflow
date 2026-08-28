import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';

console.log('🔍 ======================================================');
console.log('🔍 CampusMind Live Atlas & Gemini Verification Test');
console.log('🔍 ======================================================\n');

async function testAtlasAndGemini() {
  console.log('1. Checking Environment Variables:');
  console.log(`   - MONGODB_URI: ${config.mongodbUri ? config.mongodbUri.replace(/:([^@]+)@/, ':****@') : 'EMPTY'}`);
  console.log(`   - GEMINI_API_KEY: ${config.geminiApiKey ? config.geminiApiKey.slice(0, 8) + '...' + config.geminiApiKey.slice(-4) : 'EMPTY'}`);
  console.log(`   - GEMINI_MODEL: ${config.geminiModel}`);
  console.log(`   - GEMINI_EMBEDDING_MODEL: ${config.geminiEmbeddingModel}\n`);

  // --- Step A: Test MongoDB Atlas Connection ---
  console.log('2. Testing MongoDB Atlas Connectivity...');
  let mongoConnected = false;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`   ✅ Successfully connected to MongoDB Atlas! Host: ${mongoose.connection.host}`);
    console.log(`   ✅ Database Name: ${mongoose.connection.name}`);
    mongoConnected = true;

    // Check Collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   📁 Existing collections in Atlas DB:`, collections.map(c => c.name));

    // Check Search Indexes on chunks collection if present
    try {
      const chunksCollection = mongoose.connection.db.collection('chunks');
      const searchIndexes = await chunksCollection.listSearchIndexes().toArray();
      console.log(`   🔎 Search/Vector Indexes on 'chunks' collection:`, searchIndexes);
    } catch (idxErr) {
      console.log(`   ℹ️ Note on Atlas Search Index listing:`, idxErr.message);
    }
  } catch (mongoErr) {
    console.error(`   ❌ MongoDB Atlas Connection FAILED:`);
    console.error(`      Code: ${mongoErr.code || 'N/A'}`);
    console.error(`      Message: ${mongoErr.message}`);
    if (mongoErr.message.includes('bad auth') || mongoErr.message.includes('Authentication failed')) {
      console.error(`      👉 Diagnosis: Username or password in MONGODB_URI is incorrect.`);
    } else if (mongoErr.message.includes('buffering timed out') || mongoErr.message.includes('connection timed out') || mongoErr.message.includes('server selection')) {
      console.error(`      👉 Diagnosis: IP address is not whitelisted in MongoDB Atlas Network Access (0.0.0.0/0 or your current IP).`);
    }
  }

  // --- Step B: Test Gemini API Calls ---
  console.log('\n3. Testing Google Gemini API directly...');
  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);

    // Test Embedding
    console.log(`   Testing Embedding generation (${config.geminiEmbeddingModel})...`);
    const embedModel = genAI.getGenerativeModel({ model: config.geminiEmbeddingModel });
    const embedStart = performance.now();
    const embedResult = await embedModel.embedContent('CampusMind official college document grounding test');
    const embedDuration = (performance.now() - embedStart).toFixed(2);
    const embeddingValues = embedResult.embedding.values;
    console.log(`   ✅ Gemini Embedding Succeeded in ${embedDuration}ms!`);
    console.log(`      Dimensions: ${embeddingValues.length} floats (Sample: [${embeddingValues.slice(0, 5).map(n => n.toFixed(4)).join(', ')}...])`);

    // Test Text Generation
    console.log(`   Testing Text Generation (${config.geminiModel})...`);
    const genModel = genAI.getGenerativeModel({
      model: config.geminiModel,
      generationConfig: { maxOutputTokens: 100, temperature: 0.1 }
    });
    const genStart = performance.now();
    const genResult = await genModel.generateContent('Respond with exactly: "Gemini live connection verified for CampusMind."');
    const genDuration = (performance.now() - genStart).toFixed(2);
    const genResponse = await genResult.response;
    const rawAnswer = genResponse.text();
    console.log(`   ✅ Gemini Generation Succeeded in ${genDuration}ms!`);
    console.log(`      Raw Response: "${rawAnswer.trim()}"`);
  } catch (geminiErr) {
    console.error(`   ❌ Gemini API Call FAILED:`);
    console.error(`      Message: ${geminiErr.message}`);
    if (geminiErr.message.includes('API_KEY_INVALID') || geminiErr.message.includes('API key not valid')) {
      console.error(`      👉 Diagnosis: GEMINI_API_KEY is invalid or expired.`);
    }
  }

  if (mongoConnected) {
    await mongoose.disconnect();
  }

  console.log('\n🔍 ======================================================');
  console.log('🔍 Verification Script Finished');
  console.log('🔍 ======================================================\n');
  process.exit(0);
}

testAtlasAndGemini();
