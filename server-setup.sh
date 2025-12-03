#!/bin/bash

# Script Setup Server Digital Ocean (jalankan di server)
# Cara pakai: bash server-setup.sh

echo "🔧 Setting up Digital Ocean server..."

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
pm2 save

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/order-management
sudo chown -R $USER:$USER /var/www/order-management

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw --force enable

# Generate SSH key for GitHub Actions
echo "🔑 Generating SSH key for deployment..."
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

echo ""
echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy private key untuk GitHub Secrets:"
echo "   cat ~/.ssh/github_actions"
echo ""
echo "2. Setup Nginx config:"
echo "   sudo nano /etc/nginx/sites-available/order-management"
echo ""
echo "3. Private key ada di bawah (copy untuk GitHub Secrets DO_SSH_KEY):"
echo "==================== COPY DARI SINI ===================="
cat ~/.ssh/github_actions
echo "==================== SAMPAI SINI ===================="
