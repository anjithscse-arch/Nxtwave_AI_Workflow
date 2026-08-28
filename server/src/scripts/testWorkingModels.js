import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';

async function testWorkingModels() {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  console.log('1. Testing text generation with gemini-2.5-flash:');
  const genModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const genRes = await genModel.generateContent('Answer in one sentence: What is CampusMind?');
  console.log('✅ Generation Response:', (await genRes.response).text().trim());

  console.log('\n2. Testing embedding with gemini-embedding-001:');
  const embModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const embRes = await embModel.embedContent('Official academic calendar and examination timetable');
  console.log('✅ Embedding Values Count:', embRes.embedding.values.length);
  console.log('✅ Sample Floats:', embRes.embedding.values.slice(0, 5));
}

testWorkingModels();
