import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';

async function listGeminiModels() {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  console.log('Testing generation model gemini-1.5-flash:');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const res = await model.generateContent('Say hello');
    const txt = (await res.response).text();
    console.log('✅ gemini-1.5-flash works! Response:', txt.trim());
  } catch (e) {
    console.log('❌ gemini-1.5-flash error:', e.message);
  }

  console.log('\nTesting gemini-2.0-flash:');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const res = await model.generateContent('Say hello');
    const txt = (await res.response).text();
    console.log('✅ gemini-2.0-flash works! Response:', txt.trim());
  } catch (e) {
    console.log('❌ gemini-2.0-flash error:', e.message);
  }

  console.log('\nTesting embedding models:');
  const embeddingCandidates = ['text-embedding-004', 'embedding-001', 'models/embedding-001', 'models/text-embedding-004'];
  for (const embName of embeddingCandidates) {
    try {
      const embModel = genAI.getGenerativeModel({ model: embName });
      const embRes = await embModel.embedContent('Hello world');
      console.log(`✅ Embedding model [${embName}] works! Vector length: ${embRes.embedding.values.length}`);
    } catch (e) {
      console.log(`❌ Embedding model [${embName}] error:`, e.message);
    }
  }
}

listGeminiModels();
