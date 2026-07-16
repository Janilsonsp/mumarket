#!/bin/bash

echo "=== Deploy MuMarket ==="

# 1. Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Deploy frontend to Vercel
echo "Deploying frontend to Vercel..."
cd frontend
npx vercel --prod --yes
cd ..

echo "=== Deploy completo ==="
echo "Frontend: https://mumarket.vercel.app"
echo "Backend: configurar no Railway"
