import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { seedDemoData } from './scripts/seed.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import aiProviderFactory from './ai/aiProviderFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
// Permissive and flexible CORS for deployment (Vercel, Render, local dev)
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile, and dev/prod origins
    if (!origin || config.clientUrl === '*' || origin === config.clientUrl || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(morgan(config.isDev ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const aiStatus = aiProviderFactory.getStatus();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiProvider: aiStatus.activeProvider,
    geminiConfigured: aiStatus.geminiConfigured,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Bootstrap Server & DB
async function bootstrap() {
  try {
    await connectDB();
    await seedDemoData();

    httpServer.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 CampusMind Server running at http://localhost:${config.port}`);
      console.log(`📡 Socket.IO initialized for real-time pipeline events`);
      console.log(`🤖 Active AI Provider: ${aiProviderFactory.getStatus().activeProvider}`);
      console.log(`🛡️  Guardrail Layer Active: Rule-based + ML Classifier`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();

export { app, httpServer };
