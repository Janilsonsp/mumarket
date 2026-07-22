// Shared state for bookmarklet data
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketServer(socketIO: SocketServer) {
  io = socketIO;
}

export function getSocketServer(): SocketServer | null {
  return io;
}

// Broadcast bookmarklet data to all connected clients
export function broadcastBookmarkletData(userId: string, items: any[]) {
  if (!io) return;
  io.to(`user:${userId}`).emit('market:update', items);
}
