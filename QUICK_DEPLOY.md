# 🚀 Quick Start - Auto Deploy ke Digital Ocean

## Langkah Singkat (5 Menit Setup)

### 1️⃣ Setup Server (Di Digital Ocean Droplet)

Login ke server via SSH:
```bash
ssh root@YOUR_DROPLET_IP
```

Copy-paste script ini (all in one):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash - && \
sudo apt install -y nodejs nginx && \
sudo npm install -g pm2 && \
sudo mkdir -p /var/www/order-management && \
sudo chown -R $USER:$USER /var/www/order-management && \
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions -N "" && \
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys && \
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw --force enable && \
echo "✅ Setup selesai!"
```

Copy private key untuk GitHub:
```bash
cat ~/.ssh/github_actions
```

### 2️⃣ Setup Nginx

Buat file config:
```bash
sudo nano /etc/nginx/sites-available/order-management
```

Paste ini (ganti YOUR_IP):
```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;
    root /var/www/order-management/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Aktifkan:
```bash
sudo ln -s /etc/nginx/sites-available/order-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3️⃣ Setup GitHub (Di Windows)

Push ke GitHub:
```powershell
cd D:\order-management-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

Tambah GitHub Secrets:
1. Buka: https://github.com/USERNAME/REPO/settings/secrets/actions
2. Klik "New repository secret"
3. Tambahkan 3 secrets:

| Name | Value |
|------|-------|
| `DO_HOST` | IP Droplet (misal: `157.245.xxx.xxx`) |
| `DO_USERNAME` | `root` |
| `DO_SSH_KEY` | Paste private key dari step 1 |

### 4️⃣ SELESAI! 🎉

Sekarang setiap kali Anda:
```bash
git add .
git commit -m "update"
git push
```

Website otomatis update dalam 2-3 menit di `http://YOUR_DROPLET_IP` ✅

---

## 📝 Workflow Sehari-hari

1. Edit code di VS Code
2. Test di localhost: `npm run dev`
3. Kalau sudah OK:
   ```bash
   git add .
   git commit -m "deskripsi perubahan"
   git push
   ```
4. Tunggu 2-3 menit
5. Cek hasilnya di `http://YOUR_DROPLET_IP`

---

## 🔍 Troubleshooting

**Deployment gagal?**
- Cek: https://github.com/USERNAME/REPO/actions
- Lihat error log di tab "deploy"

**Website tidak update?**
```bash
ssh root@YOUR_DROPLET_IP
cd /var/www/order-management
ls -la dist/  # Cek tanggal file
```

**Nginx error?**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

---

Butuh bantuan? Baca file `DEPLOYMENT_DIGITALOCEAN.md` untuk panduan lengkap! 📖
