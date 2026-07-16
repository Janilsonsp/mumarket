#!/bin/bash

echo "=== Deploy Railway - Backend ==="

# Login (se necessario)
railway login

# Criar projeto
railway init mumarket-api

# Configurar root directory
railway variables set ROOT_DIR=backend

# Build
railway up --service mumarket-api

echo "=== Deploy completo ==="
echo "URL do backend aparecera no painel do Railway"
echo "Configure as variaveis de ambiente no painel:"
echo "  PORT=3000"
echo "  SUPABASE_URL=..."
echo "  SUPABASE_ANON_KEY=..."
echo "  SUPABASE_SERVICE_ROLE_KEY=..."
echo "  JWT_SECRET=..."
echo "  JWT_REFRESH_SECRET=..."
echo "  CORS_ORIGIN=https://mumarket.jdwebstudio.com.br"
