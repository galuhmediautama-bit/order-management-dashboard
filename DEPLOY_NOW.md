# 🚀 DEPLOY SEKARANG - IP: 143.198.87.240

> **SSH Key sudah ready di:** `C:\Users\alan2014\.ssh\digitalocean_rsa`

---

## ⚡ LANGKAH CEPAT

### 1️⃣ Login ke Server (Terminal Baru)

```powershell
ssh -i "C:\Users\alan2014\.ssh\digitalocean_rsa" root@143.198.87.240
```

### 2️⃣ Setup Server (Copy-Paste Semua)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash - && \
sudo apt install -y nodejs nginx && \
sudo npm install -g pm2 && \
sudo mkdir -p /var/www/order-management && \
sudo chown -R $USER:$USER /var/www/order-management && \
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions -N "" && \
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys && \
chmod 600 ~/.ssh/authorized_keys && \
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw --force enable && \
sudo bash -c 'cat > /etc/nginx/sites-available/order-management << "EOF"
server {
    listen 80;
    server_name 143.198.87.240;
    root /var/www/order-management/dist;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)\\$ {
        expires 1y; add_header Cache-Control "public, immutable";
    }
    gzip on; gzip_types text/plain text/css application/json application/javascript;
}
EOF
' && \
sudo ln -sf /etc/nginx/sites-available/order-management /etc/nginx/sites-enabled/ && \
sudo rm -f /etc/nginx/sites-enabled/default && \
sudo nginx -t && sudo systemctl reload nginx && \
echo "✅ Setup selesai! Copy private key di bawah:" && \
cat ~/.ssh/github_actions
```

**Copy private key dari output** (dari `-----BEGIN` sampai `-----END-----`)

---

### 3️⃣ Push ke GitHub

```powershell
cd D:\order-management-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

---

### 4️⃣ GitHub Secrets

Buka: **https://github.com/USERNAME/REPO/settings/secrets/actions**

Tambah 3 secrets:

| Name | Value |
|------|-------|
| `DO_HOST` | `143.198.87.240` |
| `DO_USERNAME` | `root` |
| `DO_SSH_KEY` | (Paste private key dari step 2) |

---

### 5️⃣ Test Deploy

```powershell
git add .
git commit -m "test deploy"
git push
```

Cek: **http://143.198.87.240** (tunggu 2-3 menit)

---

## ✅ DONE!

Setiap `git push` = Auto deploy! 🎉
