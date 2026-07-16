import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

dotenv.config();

const COOKIE_FILE = join(__dirname, '..', '.mudream-cookie');

function loadPersistedCookie(): string {
  if (existsSync(COOKIE_FILE)) {
    try {
      return readFileSync(COOKIE_FILE, 'utf-8').trim();
    } catch {
      return '';
    }
  }
  return '';
}

function persistCookie(cookie: string) {
  try {
    writeFileSync(COOKIE_FILE, cookie, 'utf-8');
  } catch (err) {
    console.error('[Config] Failed to persist cookie:', err);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-me',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  mudream: {
    graphqlEndpoint: process.env.MUDREAM_GRAPHQL_ENDPOINT || 'https://mudream.online/api/graphql',
    cookie: process.env.MUDREAM_COOKIE || loadPersistedCookie(),
  },
  setMudreamCookie(cookie: string) {
    this.mudream.cookie = cookie;
    persistCookie(cookie);
  },
};
