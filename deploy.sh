#!/bin/bash

echo "=== MuMarket Deploy Script ==="

# 1. Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# 2. Build backend
echo "Building backend..."
cd backend
npm run build
cd ..

# 3. Install production dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --omit=dev
cd ..

echo "=== Build complete ==="
echo "Frontend: frontend/dist/"
echo "Backend: backend/dist/"
echo ""
echo "Next steps:"
echo "1. Upload frontend/dist/ to Hostinger public_html/"
echo "2. Upload backend/ to server"
echo "3. Configure .env.production"
echo "4. Run: cd backend && node dist/index.js"
