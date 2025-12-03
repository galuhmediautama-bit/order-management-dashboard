# 📖 Panduan Deployment ke DigitalOcean

Berikut adalah langkah-langkah lengkap untuk menjalankan Order Management Dashboard di DigitalOcean.

---

## **Opsi 1: Menggunakan App Platform (Recommended - Termudah)**

### **Langkah 1: Siapkan Repository GitHub**

1. Push project Anda ke GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/order-management-dashboard.git
git push -u origin main
```

2. Pastikan `.gitignore` sudah ada dan mengecualikan:
   - `node_modules/`
   - `dist/`
   - `.env.local`
   - `.DS_Store`

### **Langkah 2: Buat App di DigitalOcean**

1. Login ke [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Klik **"Apps"** di sidebar kiri
3. Klik **"Create App"**
4. Pilih **"GitHub"** dan authorize DigitalOcean
5. Pilih repository Anda: `username/order-management-dashboard`

### **Langkah 3: Konfigurasi Build & Run**

Dalam form App Configuration:

**Build Command:**
```bash
npm install && npm run build
```

**Run Command:**
```bash
npm start
```

Jika npm start tidak tersedia, gunakan:
```bash
npx vite preview --host 0.0.0.0 --port 8080
```

### **Langkah 4: Environment Variables**

Tambahkan environment variables di DigitalOcean:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_FIREBASE_API_KEY=your_firebase_key_here
```

> Dapatkan nilai-nilai ini dari:
> - **Supabase**: Settings → API → URL dan anon key
> - **Firebase**: Project Settings → General → Copy config values

### **Langkah 5: Deploy**

1. Klik **"Next"** → **"Create Resources"**
2. Pilih plan (Basic plan sudah cukup untuk pemula)
3. Klik **"Create App"** dan tunggu deployment selesai (~5-10 menit)

---

## **Opsi 2: Menggunakan Droplet + PM2 (Kontrol Lebih)**

### **Langkah 1: Buat Droplet**

1. Login ke DigitalOcean Dashboard
2. Klik **"Create"** → **"Droplets"**
3. Pilih:
   - **OS**: Ubuntu 24.04 x64
   - **Plan**: Basic - $6/bulan (1GB RAM, 1 vCPU)
4. Pilih region terdekat (Singapore/Jakarta)
5. Tambahkan SSH key Anda (atau gunakan password)
6. Klik **"Create Droplet"**

### **Langkah 2: Setup Server**

SSH ke droplet:
```bash
ssh root@your_droplet_ip
```

Update sistem:
```bash
apt update && apt upgrade -y
apt install -y curl git vim
```

Install Node.js (v20 LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

Verifikasi instalasi:
```bash
node --version
npm --version
```

### **Langkah 3: Clone & Setup Project**

```bash
cd /home
git clone https://github.com/username/order-management-dashboard.git
cd order-management-dashboard
```

Install dependencies:
```bash
npm install
```

Buat file `.env.local`:
```bash
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_FIREBASE_API_KEY=your_firebase_key_here
EOF
```

Build project:
```bash
npm run build
```

### **Langkah 4: Install & Setup PM2**

PM2 adalah process manager untuk Node.js:

```bash
npm install -g pm2
```

Buat `ecosystem.config.js`:
```bash
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
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
```

Mulai dengan PM2:
```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### **Langkah 5: Setup Nginx Reverse Proxy**

Install Nginx:
```bash
apt install -y nginx
```

Edit konfigurasi:
```bash
nano /etc/nginx/sites-available/default
```

Ganti isi dengan:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

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
    }
}
```

Test & restart Nginx:
```bash
nginx -t
systemctl restart nginx
```

### **Langkah 6: Setup SSL (HTTPS)**

Install Certbot:
```bash
apt install -y certbot python3-certbot-nginx
```

Generate SSL certificate:
```bash
certbot --nginx -d yourdomain.com
```

> Jika belum punya domain, bisa gunakan IP droplet dulu, atau beli domain di Namecheap/Google Domains

---

## **Opsi 3: Menggunakan DigitalOcean's Static Site Hosting**

Karena ini React SPA, bisa di-host sebagai static site:

### **Build Project Locally**

```bash
npm run build
```

Ini akan membuat folder `dist/` dengan file-file static.

### **Upload ke DigitalOcean Spaces (CDN)**

1. Buat Space di DigitalOcean:
   - Klik **Spaces** → **Create Space**
   - Nama: `order-dashboard`
   - Region: Singapore/Jakarta

2. Upload file `dist/`:
```bash
# Install AWS CLI
pip install awscli-local

# Configure (gunakan Spaces credentials dari DigitalOcean)
aws configure --profile digitalocean

# Upload
aws s3 sync dist/ s3://order-dashboard --profile digitalocean
```

3. Enable static site hosting di Spaces settings
4. Akses via URL yang diberikan

---

## **Troubleshooting**

### **1. Halaman Blank/Error 404**

**Masalah**: React Router tidak bekerja di DigitalOcean

**Solusi**: Edit `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

### **2. Env Variables Tidak Terbaca**

**Masalah**: `VITE_*` variables tidak bisa diakses di production

**Solusi**: 
- Pastikan nama diawali dengan `VITE_`
- Di JavaScript, akses via `import.meta.env.VITE_SUPABASE_URL`
- Rebuild setelah mengubah env variables

### **3. Port 3000 Already in Use**

```bash
# Cek port mana yang pakai
lsof -i :3000

# Kill process
kill -9 PID

# Atau ganti port di PM2
```

### **4. Supabase Connection Error**

Pastikan di Supabase settings:
- **Network** → **Add IP whitelist** → Tambahkan IP droplet Anda
- Atau allow all IPs (search "CORS")

---

## **Tips Penting**

✅ **Backup Database**: Supabase sudah handle ini
✅ **Update Regular**: Jalankan `git pull && npm install && npm run build` periodically
✅ **Monitor Logs**: 
```bash
pm2 logs order-dashboard
```

✅ **Auto-Restart**: PM2 sudah setup auto-restart on reboot

---

## **Perbandingan Opsi**

| Opsi | Kemudahan | Fleksibilitas | Harga | Waktu Setup |
|------|-----------|---------------|-------|------------|
| **App Platform** | ⭐⭐⭐⭐⭐ | ⭐⭐ | $5-12/bulan | 10 min |
| **Droplet + PM2** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $6-12/bulan | 30 min |
| **Spaces (Static)** | ⭐⭐⭐⭐ | ⭐ | $5+/bulan | 15 min |

**Rekomendasi**: Gunakan **App Platform** untuk pemula, atau **Droplet + PM2** jika ingin kontrol penuh.

---

## **Langkah Selanjutnya**

Setelah deployment berhasil:

1. **Setup Domain**: Pointing ke IP droplet atau App Platform
2. **SSL Certificate**: Automatic dengan App Platform, atau gunakan Certbot untuk Droplet
3. **Email Notifications**: Setup email service untuk notifikasi approval
4. **Monitoring**: Setup DigitalOcean Monitoring untuk CPU/RAM/Disk usage
5. **Backups**: Enable backups di Droplet settings (untuk database lokal, jika ada)

---

**Butuh bantuan?** Tanyakan step mana yang tidak jelas! 🚀
