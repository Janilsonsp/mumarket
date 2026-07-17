import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { runMigrations } from './database';
import { setupSocket } from './services/socket';
import authRoutes from './routes/auth';
import filterRoutes from './routes/filters';
import marketRoutes from './routes/market';
import monitoringRoutes from './routes/monitoring';
import configRoutes from './routes/config';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);

// Parse CORS origins
const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());

const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());

// CORS - handle multiple origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../../../frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

setupSocket(io);

async function start() {
  try {
    await runMigrations();
    console.log('[DB] Migrations completed');

    httpServer.listen(config.port, () => {
      console.log(`[Server] Running on port ${config.port}`);
      console.log(`[Server] CORS origin: ${config.cors.origin}`);
      console.log(`[Server] Frontend: ${frontendPath}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();
