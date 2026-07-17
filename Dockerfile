FROM node:20-slim

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json ./

# Copy all workspace directories
COPY backend/ ./backend/
COPY shared/ ./shared/

# Install all dependencies
RUN npm install

# Build backend
RUN cd backend && npm run build

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/index.js"]
