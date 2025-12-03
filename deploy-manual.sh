#!/bin/bash

# Manual Deploy Script (jika tidak pakai GitHub Actions)
# Cara pakai: bash deploy-manual.sh

echo "🚀 Starting deployment to Digital Ocean..."

# Konfigurasi - GANTI INI
DO_HOST="YOUR_DROPLET_IP"
DO_USER="root"
REMOTE_PATH="/var/www/order-management"

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "📤 Uploading files to server..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'src' \
    dist/ package.json package-lock.json \
    ${DO_USER}@${DO_HOST}:${REMOTE_PATH}/

echo "🔄 Installing dependencies on server..."
ssh ${DO_USER}@${DO_HOST} << 'ENDSSH'
cd /var/www/order-management
npm ci --production
pm2 restart order-management || pm2 start npm --name "order-management" -- start
pm2 save
ENDSSH

echo "✅ Deployment completed!"
echo "🌐 Visit: http://${DO_HOST}"
