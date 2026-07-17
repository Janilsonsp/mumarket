import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../auth/jwt';
import { marketMonitor } from '../services/market-monitor';
import { FilterMatch, MarketItem, MonitoringStatus } from '../shared/types';

export function setupSocket(io: SocketServer) {
  const authenticatedSockets = new Map<string, string>();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] Client connected: ${socket.id} (user: ${userId})`);
    
    authenticatedSockets.set(socket.id, userId);

    socket.join(`user:${userId}`);

    socket.on('monitoring:start', (interval?: number) => {
      marketMonitor.refreshFilters();
      marketMonitor.start(interval);
      socket.emit('monitoring:status', { isOnline: true, pollingInterval: interval || 3000 });
    });

    socket.on('monitoring:stop', () => {
      marketMonitor.stop();
      socket.emit('monitoring:status', { isOnline: false });
    });

    socket.on('monitoring:setCookie', (cookie: string) => {
      marketMonitor.setCookie(cookie);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      authenticatedSockets.delete(socket.id);
    });
  });

  marketMonitor.on('item:match', (matches: any[]) => {
    io.emit('item:match', matches);
  });

  marketMonitor.on('market:update', (items: any[]) => {
    io.emit('market:update', items);
  });

  marketMonitor.on('monitoring:error', (errorMessage: string) => {
    io.emit('monitoring:status', { isOnline: true, error: errorMessage });
  });

  return io;
}

export function broadcastStatus(io: SocketServer, status: MonitoringStatus) {
  io.emit('monitoring:status', status);
}
