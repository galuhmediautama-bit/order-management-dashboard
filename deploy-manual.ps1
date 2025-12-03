# Manual Deploy Script untuk Windows PowerShell
# Cara pakai: .\deploy-manual.ps1

Write-Host "🚀 Starting deployment to Digital Ocean..." -ForegroundColor Cyan

# Konfigurasi - GANTI INI
$DO_HOST = "YOUR_DROPLET_IP"
$DO_USER = "root"
$REMOTE_PATH = "/var/www/order-management"

Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Uploading files to server..." -ForegroundColor Yellow

# Upload menggunakan SCP (pastikan sudah install OpenSSH)
scp -r dist/* package.json package-lock.json "${DO_USER}@${DO_HOST}:${REMOTE_PATH}/"

Write-Host "🔄 Installing dependencies and restarting..." -ForegroundColor Yellow
ssh ${DO_USER}@${DO_HOST} "cd ${REMOTE_PATH} && npm ci --production && pm2 restart order-management || pm2 start npm --name 'order-management' -- start && pm2 save"

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Visit: http://${DO_HOST}" -ForegroundColor Cyan
