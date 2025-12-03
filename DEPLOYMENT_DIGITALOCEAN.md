# 🚀 Panduan Deploy Otomatis ke Digital Ocean

## 📋 Persiapan

### 1. Setup Digital Ocean Droplet

1. **Buat Droplet** di Digital Ocean:
   - OS: Ubuntu 22.04 LTS
   - Plan: Basic ($6/bulan sudah cukup untuk start)
   - Region: Singapore (untuk Indonesia lebih cepat)

2. **Catat IP Address** droplet Anda (misal: `157.245.xxx.xxx`)

### 2. Setup Server (Pertama Kali)

Login ke droplet via SSH:

```bash
ssh root@YOUR_DROPLET_IP
```

Jalankan script setup berikut:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
apt install -y nginx

# Buat direktori aplikasi
mkdir -p /var/www/order-management
chown -R $USER:$USER /var/www/order-management

# Setup firewall
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw enable
```

### 3. Konfigurasi Nginx

Buat file konfigurasi:

```bash
nano /etc/nginx/sites-available/order-management
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;  # Ganti dengan domain atau IP Anda

    root /var/www/order-management/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Aktifkan konfigurasi:

```bash
ln -s /etc/nginx/sites-available/order-management /etc/nginx/sites-enabled/
nginx -t  # Test konfigurasi
systemctl reload nginx
```

### 4. Setup GitHub Repository

1. **Push project ke GitHub**:

```bash
# Di local (Windows PowerShell)
cd D:\order-management-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

2. **Generate SSH Key untuk GitHub Actions**:

Di server Digital Ocean:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions  # Copy private key
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

3. **Setup GitHub Secrets**:

Buka: `https://github.com/USERNAME/REPO_NAME/settings/secrets/actions`

Tambahkan 3 secrets:

| Name | Value |
|------|-------|
| `DO_HOST` | IP Droplet Anda (misal: `157.245.xxx.xxx`) |
| `DO_USERNAME` | `root` (atau username lain) |
| `DO_SSH_KEY` | Paste isi private key dari `~/.ssh/github_actions` |

**Cara copy private key:**
```bash
cat ~/.ssh/github_actions
```
Copy semua dari `-----BEGIN RSA PRIVATE KEY-----` sampai `-----END RSA PRIVATE KEY-----`

---

## 🔄 Cara Kerja Auto-Deploy

Setelah setup selesai:

1. **Edit code** di local (VS Code)
2. **Save & commit**:
   ```bash
   git add .
   git commit -m "update fitur xxx"
   git push
   ```
3. **GitHub Actions otomatis**:
   - Build project
   - Upload ke Digital Ocean
   - Restart aplikasi
   - Selesai dalam 2-3 menit ✅

4. Buka website: `http://YOUR_DROPLET_IP` atau domain Anda

---

## 🔍 Monitoring & Troubleshooting

### Cek Status Deployment

Lihat di GitHub: `https://github.com/USERNAME/REPO_NAME/actions`

### Cek Logs di Server

```bash
# Login ke server
ssh root@YOUR_DROPLET_IP

# Cek Nginx logs
tail -f /var/log/nginx/error.log

# Cek PM2 logs (jika pakai PM2)
pm2 logs order-management

# Cek status aplikasi
pm2 status
```

### Troubleshooting

**Deployment gagal?**
- Cek GitHub Actions logs
- Pastikan secrets sudah benar
- Cek SSH key sudah di `authorized_keys`

**Website tidak bisa diakses?**
```bash
systemctl status nginx
nginx -t
```

**File tidak terupdate?**
```bash
cd /var/www/order-management
ls -la dist/  # Cek tanggal file
```

---

## 🌐 Setup Domain (Opsional)

Jika punya domain (misal: `order.example.com`):

1. **Tambah A Record** di DNS provider:
   ```
   Type: A
   Name: order (atau @)
   Value: YOUR_DROPLET_IP
   TTL: 3600
   ```

2. **Update Nginx config**:
   ```bash
   nano /etc/nginx/sites-available/order-management
   ```
   Ganti `server_name` dengan domain Anda

3. **Install SSL (HTTPS) gratis**:
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d order.example.com
   ```

---

## 📦 File Struktur di Server

```
/var/www/order-management/
├── dist/              # Build files dari npm run build
│   ├── index.html
│   ├── assets/
│   └── ...
├── package.json
├── package-lock.json
└── node_modules/      # Hanya production dependencies
```

---

## 💡 Tips

1. **Cek build di local dulu** sebelum push:
   ```bash
   npm run build
   ```

2. **Buat branch development**:
   ```bash
   git checkout -b dev
   # Edit dan test di branch dev
   git push origin dev
   # Setelah yakin, merge ke main
   git checkout main
   git merge dev
   git push  # Ini yang trigger auto-deploy
   ```

3. **Environment variables**: 
   - Jangan commit `.env` ke GitHub
   - Simpan secrets di GitHub Secrets atau buat `.env` manual di server

4. **Backup database** (Supabase sudah auto backup)

---

## 🎯 Next Steps

✅ Setup selesai  
✅ Auto-deploy aktif  
🔄 Edit code → git push → Live dalam 2-3 menit  

**Ingin tambah fitur?**
- Notification Discord/Telegram saat deploy sukses
- Rollback otomatis jika deploy gagal
- Multi-environment (staging + production)

Butuh bantuan? Tanya saja! 🚀
