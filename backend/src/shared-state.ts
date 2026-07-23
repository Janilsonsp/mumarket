// Shared state for bookmarklet data
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketServer(socketIO: SocketServer) {
  io = socketIO;
  console.log('[SharedState] Socket.IO server injected');
}

export function getSocketServer(): SocketServer | null {
  return io;
}

// Broadcast bookmarklet data to all connected clients
export function broadcastBookmarkletData(userId: string, items: any[], matches: any[]) {
  if (!io) {
    console.log('[SharedState] Socket.IO not initialized');
    return;
  }
  console.log(`[SharedState] Broadcasting ${items.length} items, ${matches.length} matches to user:${userId}`);
  
  // Broadcast items to the user's room
  io.to(`user:${userId}`).emit('market:update', items);
  
  // Broadcast matches to the user's room
  if (matches.length > 0) {
    io.to(`user:${userId}`).emit('item:match', matches);
  }
  
  // Also broadcast to all clients as fallback
  io.emit('market:update', items);
  if (matches.length > 0) {
    io.emit('item:match', matches);
  }
}
