FROM node:20-slim

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY backend/ ./
COPY shared/ ../shared/

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/index.js"]
