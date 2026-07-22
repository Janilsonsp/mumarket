FROM node:22-slim

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json ./

# Copy backend and shared workspace directories (frontend is on Vercel)
COPY backend/ ./backend/
COPY shared/ ./shared/

# Create dummy frontend package.json so npm workspaces doesn't fail
RUN mkdir -p frontend && echo '{"name":"frontend","private":true,"version":"0.0.0"}' > frontend/package.json

# Install all workspace dependencies
RUN npm install

# Build backend (tsc compiles backend + resolves shared types)
RUN cd backend && npm run build

# Railway provides PORT env var (default 8080)
EXPOSE ${PORT:-8080}

WORKDIR /app/backend

CMD ["node", "dist/src/index.js"]
