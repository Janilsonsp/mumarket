FROM node:22-slim

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json ./

# Copy backend and shared workspace directories (frontend is on Vercel)
COPY backend/ ./backend/
COPY shared/ ./shared/

# Install all dependencies (skip missing frontend workspace)
RUN npm install --workspaces --if-present || npm install

# Build shared types first, then backend
RUN cd shared && npm install 2>/dev/null; cd ../backend && npm run build

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/src/index.js"]
