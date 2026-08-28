import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean, zero-banner .env loader
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'campusmind-default-jwt-secret-key-replace-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongodbUri: process.env.MONGODB_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.35'),
  topK: parseInt(process.env.TOP_K || '5', 10),
  guardrailConfidenceThreshold: parseFloat(process.env.GUARDRAIL_CONFIDENCE_THRESHOLD || '0.70'),
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
};

export default config;
