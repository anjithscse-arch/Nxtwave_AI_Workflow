import { Server } from 'socket.io';
import config from './env.js';

let ioInstance = null;

export function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || config.clientUrl === '*' || origin === config.clientUrl || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.netlify.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 30000
  });

  ioInstance.on('connection', (socket) => {
    // Join a specific chat session room or user room
    socket.on('join-session', (sessionId) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
      }
    });

    socket.on('leave-session', (sessionId) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
      }
    });

    socket.on('join-admin', () => {
      socket.join('admin-room');
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

/**
 * Emits a real-time pipeline event to the specific session room and any admin observers.
 * @param {string} sessionId
 * @param {Object} stageEvent - { stage, status, message, data, durationMs, timestamp }
 */
export function emitPipelineEvent(sessionId, stageEvent) {
  if (!ioInstance) return;
  
  const payload = {
    sessionId,
    timestamp: new Date().toISOString(),
    ...stageEvent
  };

  if (sessionId) {
    ioInstance.to(`session:${sessionId}`).emit('pipeline:stage', payload);
  }
  // Also emit to admin stream for live monitoring
  ioInstance.to('admin-room').emit('pipeline:stage', payload);
}

/**
 * Emits an admin notification (e.g. Ingestion complete/failed, repeated guardrail alerts)
 * @param {Object} notification
 */
export function emitAdminNotification(notification) {
  if (!ioInstance) return;
  ioInstance.to('admin-room').emit('notification:new', notification);
}
