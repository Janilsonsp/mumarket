# MuDream Market Tracker

Sistema de monitoramento de market do MuDream com filtros personalizados.

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express + TypeScript
- **Banco**: Supabase (PostgreSQL)
- **Realtime**: Socket.IO

## Deploy

### Pre-requisitos
- Node.js 18+
- npm
- Conta no Supabase
- Dominio configurado

### Build
```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build
```

### Configuracao
1. Copie `backend/.env.example` para `backend/.env`
2. Preencha as variaveis de ambiente
3. Para production, use `backend/.env.production`

### Execucao
```bash
# Development
npm run dev

# Production
cd backend && node dist/index.js
```

### Deploy na Hostinger
1. Upload de `frontend/dist/` para `public_html/`
2. Upload do backend para o servidor
3. Configurar `.env.production`
4. Iniciar com PM2: `pm2 start ecosystem.config.js`

### Deploy no Railway
1. Conectar repositorio GitHub
2. Configurar root directory: `backend`
3. Configurar variaveis de ambiente
4. Deploy automatico

## Estrutura
```
MuMarket/
  frontend/     -> React + Vite
  backend/      -> Express + TypeScript
  shared/       -> Tipos compartilhados
```

## Variaveis de Ambiente
Ver `backend/.env.example` para a lista completa.
