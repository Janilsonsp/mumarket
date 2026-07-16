-- MuDream Market Tracker - Supabase Schema
-- Execute este SQL no SQL Editor do Supabase

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de filtros
CREATE TABLE IF NOT EXISTS filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_name TEXT,
  category TEXT,
  rarity TEXT,
  level INTEGER,
  ancient BOOLEAN DEFAULT FALSE,
  excellent BOOLEAN DEFAULT FALSE,
  excellent_options TEXT[] DEFAULT '{}',
  socket BOOLEAN DEFAULT FALSE,
  min_sockets INTEGER DEFAULT 0,
  luck BOOLEAN DEFAULT FALSE,
  skill BOOLEAN DEFAULT FALSE,
  max_price_zen BIGINT,
  max_price_dc INTEGER,
  max_price_wcoin INTEGER,
  max_price_jewel INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens do Market
CREATE TABLE IF NOT EXISTS market_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  rarity TEXT,
  level INTEGER DEFAULT 0,
  ancient BOOLEAN DEFAULT FALSE,
  excellent BOOLEAN DEFAULT FALSE,
  excellent_options TEXT[] DEFAULT '{}',
  socket BOOLEAN DEFAULT FALSE,
  socket_count INTEGER DEFAULT 0,
  luck BOOLEAN DEFAULT FALSE,
  skill BOOLEAN DEFAULT FALSE,
  price_zen BIGINT DEFAULT 0,
  price_dc INTEGER DEFAULT 0,
  price_wcoin INTEGER DEFAULT 0,
  price_jewel INTEGER DEFAULT 0,
  seller TEXT,
  image_url TEXT,
  listed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  appearances INTEGER DEFAULT 1,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de matches (itens que satisfazem filtros)
CREATE TABLE IF NOT EXISTS filter_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id UUID NOT NULL REFERENCES filters(id) ON DELETE CASCADE,
  filter_name TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  notification_sent BOOLEAN DEFAULT FALSE,
  price_zen BIGINT,
  price_dc INTEGER,
  price_wcoin INTEGER,
  price_jewel INTEGER,
  seller TEXT,
  image_url TEXT,
  item_url TEXT
);

-- Tabela de histórico de preços
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  price_zen BIGINT DEFAULT 0,
  price_dc INTEGER DEFAULT 0,
  price_wcoin INTEGER DEFAULT 0,
  price_jewel INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER,
  metadata JSONB
);

-- Tabela de refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_filters_user_id ON filters(user_id);
CREATE INDEX IF NOT EXISTS idx_filters_is_active ON filters(is_active);
CREATE INDEX IF NOT EXISTS idx_market_items_listing_id ON market_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_market_items_item_name ON market_items(item_name);
CREATE INDEX IF NOT EXISTS idx_filter_matches_filter_id ON filter_matches(filter_id);
CREATE INDEX IF NOT EXISTS idx_filter_matches_item_id ON filter_matches(item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_item_id ON price_history(item_id);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
