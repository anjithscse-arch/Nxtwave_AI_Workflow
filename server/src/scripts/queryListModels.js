import config from '../config/env.js';

async function queryListModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log(`Found ${data.models.length} models:`);
      data.models.forEach(m => {
        console.log(` - Name: ${m.name} | Supported: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('Error fetching models:', err);
  }
}

queryListModels();
