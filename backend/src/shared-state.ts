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
  if (!io) {
    console.log('[SharedState] Socket.IO not initialized');
    return;
  }
  console.log(`[SharedState] Broadcasting ${items.length} items to user:${userId}`);
  io.to(`user:${userId}`).emit('market:update', items);
  io.emit('market:update', items);
}
