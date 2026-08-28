import { io } from 'socket.io-client';

let socket = null;

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Connected to CampusMind Socket.IO gateway, ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO gateway');
    });
  }

  return socket;
}

export function joinSessionRoom(sessionId) {
  const s = getSocket();
  if (s && sessionId) {
    s.emit('join-session', sessionId);
  }
}

export function leaveSessionRoom(sessionId) {
  const s = getSocket();
  if (s && sessionId) {
    s.emit('leave-session', sessionId);
  }
}

export function joinAdminRoom() {
  const s = getSocket();
  if (s) {
    s.emit('join-admin');
  }
}

export function subscribeToPipelineEvents(callback) {
  const s = getSocket();
  if (s) {
    s.on('pipeline:stage', callback);
  }
  return () => {
    if (s) s.off('pipeline:stage', callback);
  };
}

export function subscribeToNotifications(callback) {
  const s = getSocket();
  if (s) {
    s.on('notification:new', callback);
  }
  return () => {
    if (s) s.off('notification:new', callback);
  };
}

export default {
  getSocket,
  joinSessionRoom,
  leaveSessionRoom,
  joinAdminRoom,
  subscribeToPipelineEvents,
  subscribeToNotifications
};
