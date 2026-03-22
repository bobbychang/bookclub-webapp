#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest changes from git..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Generate Prisma client
echo "💎 Generating Prisma client..."
npx prisma generate

# 4. Sync Database Schema to Production
echo "🗄️ Syncing Database Schema..."
npx prisma db push --skip-generate

# 5. Build application
echo "🏗️ Building application..."
npm run build

# 5. Restart application
echo "🔄 Restarting application..."
# Find and kill any existing next-server process
pkill -f 'next-server' || true

# Start the app in the background using nohup
nohup npm run start > app.log 2>&1 &

echo "✅ Deployment Successful!"
echo "📡 App is running in the background. Check app.log for details."
