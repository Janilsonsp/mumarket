# Deploy MuMarket - Vercel + Railway

## Arquitetura
- **Frontend**: Vercel (estatico, React + Vite)
- **Backend**: Railway (Node.js, Express + Socket.IO)

## Passo 1: Deploy Backend no Railway

### 1.1 Criar conta no Railway
- Acesse https://railway.app
- Crie uma conta (gratis ate 500h/mes)

### 1.2 Criar projeto
- Clique "New Project" > "Deploy from GitHub repo"
- Conecte seu repositorio GitHub

### 1.3 Configurar
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`

### 1.4 Variaveis de Ambiente
Adicione no painel do Railway:
```
PORT=3000
SUPABASE_URL=https://rlkwezadhrnskzgdzlpa.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=sua-chave-segura-aqui
JWT_REFRESH_SECRET=outra-chave-segura-aqui
CORS_ORIGIN=https://mumarket.jdwebstudio.com.br
MUDREAM_GRAPHQL_ENDPOINT=https://mudream.online/api/graphql
MUDREAM_COOKIE=
```

### 1.5 URL do Backend
- Railway atribui uma URL como `seu-app.up.railway.app`
- Anote esta URL para usar no frontend

## Passo 2: Deploy Frontend no Vercel

### 2.1 Criar conta no Vercel
- Acesse https://vercel.com
- Conecte sua conta GitHub

### 2.2 Criar projeto
- Clique "New Project" > "Import Git Repository"
- Selecione o repositorio MuMarket

### 2.3 Configurar
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.4 Variaveis de Ambiente
Adicione no painel do Vercel:
```
VITE_API_URL=https://seu-app.up.railway.app
```

### 2.5 Deploy
- O Vercel faz deploy automatico a cada push
- URL: `https://mumarket.vercel.app`

## Passo 3: Configurar Dominio

### 3.1 No Vercel
- Va em Settings > Domains
- Adicione `mumarket.jdwebstudio.com.br`
- O Vercel mostra os registros DNS necessarios

### 3.2 No painel Hostinger
- Va em DNS Management
- Adicione os registros mostrados pelo Vercel:
  - **Tipo**: CNAME ou A
  - **Nome**: mumarket (ou @)
  - **Valor**: apontando para o Vercel

### 3.3 SSL
- O Vercel configura SSL automaticamente
- Aguarde propagação do DNS (ate 24h)

## Passo 4: Atualizar CORS

### 4.1 No Railway
- Atualize `CORS_ORIGIN` para `https://mumarket.jdwebstudio.com.br`
- Redeploy automatico

### 4.2 No Vercel
- Atualize `VITE_API_URL` se necessario

## Verificacao
1. Acesse https://mumarket.jdwebstudio.com.br
2. Login deve funcionar
3. Socket.IO deve conectar
4. Filtros e monitoramento devem funcionar

## Comandos Uteis

### Build local
```bash
cd frontend && npm run build
cd ../backend && npm run build
```

### Testar production local
```bash
cd backend && node dist/index.js
# Acesse http://localhost:3000
```
