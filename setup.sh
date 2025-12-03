#!/bin/bash

# Order Management Dashboard - DigitalOcean Droplet Setup Script
# Run: bash setup.sh

set -e

echo "🚀 Starting Order Dashboard Setup..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js v20 LTS
echo -e "${BLUE}📦 Installing Node.js v20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify Node.js
echo -e "${GREEN}✓ Node.js version:${NC}"
node --version
npm --version

# Install Git
echo -e "${BLUE}📦 Installing Git...${NC}"
apt install -y git

# Create application directory
APP_DIR="/var/www/order-dashboard"
echo -e "${BLUE}📦 Creating application directory: $APP_DIR${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
echo -e "${BLUE}📦 Cloning repository...${NC}"
git clone https://github.com/username/order-management-dashboard.git .

# Install dependencies
echo -e "${BLUE}📦 Installing npm dependencies...${NC}"
npm install

# Create environment file
echo -e "${BLUE}📝 Creating .env.local file...${NC}"
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_FIREBASE_API_KEY=your_firebase_key_here
EOF

echo -e "${BLUE}⚠️  IMPORTANT: Edit .env.local with your actual credentials:${NC}"
echo "nano /var/www/order-dashboard/.env.local"

# Build project
echo -e "${BLUE}📦 Building project...${NC}"
npm run build

# Install PM2 globally
echo -e "${BLUE}📦 Installing PM2...${NC}"
npm install -g pm2

# Create PM2 ecosystem file
echo -e "${BLUE}📝 Creating PM2 ecosystem config...${NC}"
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'order-dashboard',
    script: 'npx',
    args: 'vite preview --host 0.0.0.0 --port 3000',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
echo -e "${BLUE}🚀 Starting application with PM2...${NC}"
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Install Nginx
echo -e "${BLUE}📦 Installing Nginx...${NC}"
apt install -y nginx

# Create Nginx configuration
echo -e "${BLUE}📝 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Cache static assets
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Test Nginx configuration
nginx -t

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Install Certbot for SSL (optional)
echo -e "${BLUE}📦 Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit environment file:"
echo "   nano /var/www/order-dashboard/.env.local"
echo ""
echo "2. Add your Supabase and Firebase credentials"
echo ""
echo "3. Restart the application:"
echo "   cd /var/www/order-dashboard && npm run build && pm2 restart all"
echo ""
echo "4. (Optional) Setup HTTPS:"
echo "   certbot --nginx -d yourdomain.com"
echo ""
echo -e "${BLUE}Application should be running at:${NC}"
echo "   http://your_droplet_ip"
echo ""
echo -e "${BLUE}Useful PM2 commands:${NC}"
echo "   pm2 logs order-dashboard    # View logs"
echo "   pm2 restart order-dashboard # Restart app"
echo "   pm2 stop order-dashboard    # Stop app"
echo "   pm2 start order-dashboard   # Start app"
echo ""
