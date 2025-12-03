# 🚀 Deployment Order Management Dashboard ke DigitalOcean

Panduan lengkap dalam 3 opsi deployment. Pilih yang paling sesuai dengan kebutuhan Anda.

---

## **OPSI 1: App Platform (TERMUDAH ⭐⭐⭐⭐⭐)**

**Cocok untuk**: Pemula yang ingin deploy cepat dan mudah. Tidak perlu manage server.

### Setup GitHub Repository
```bash
# Di folder project lokal
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/order-management-dashboard.git
git push -u origin main
```

### Steps di DigitalOcean
1. Login → Klik **Apps**
2. **Create App** → Pilih **GitHub**
3. Authorize & pilih repository Anda
4. **GitHub Settings**:
   - Branch: `main`
   - Auto-deploy: Enable
5. **Build Command**: `npm install && npm run build`
6. **Run Command**: `npx vite preview --host 0.0.0.0 --port 8080`
7. **Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```
8. **Create Resources** → Tunggu ~5-10 menit ✓

**Harga**: $5-12/bulan | **Waktu Setup**: ~10 menit

---

## **OPSI 2: Droplet + PM2 (RECOMMENDED 🔥)**

**Cocok untuk**: Developer yang ingin kontrol penuh dan skalabilitas lebih baik.

### 1️⃣ Buat Droplet di DigitalOcean

```
Dashboard → Create → Droplets
├─ OS: Ubuntu 24.04 x64
├─ Plan: Basic ($6/bulan) → 1GB RAM, 1 vCPU
├─ Region: Singapore atau Jakarta
└─ Add SSH Key (atau set password)
```

### 2️⃣ SSH ke Droplet
```bash
ssh root@your_droplet_ip
```

### 3️⃣ Jalankan Setup Script
Copy script ini langsung ke terminal:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/username/order-management-dashboard/main/setup.sh)"
```

Atau manual:
```bash
apt update && apt upgrade -y
apt install -y curl git nodejs npm

# Clone repository
mkdir -p /var/www/order-dashboard
cd /var/www/order-dashboard
git clone https://github.com/username/order-management-dashboard.git .

# Setup environment
cat > .env.local << EOF
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
EOF

# Build & Start
npm install
npm run build
npm install -g pm2
pm2 start "npx vite preview --host 0.0.0.0 --port 3000" --name order-dashboard
pm2 startup
pm2 save

# Setup Nginx
apt install -y nginx
# (Konfigurasi Nginx untuk proxy ke port 3000)
systemctl restart nginx
```

**Harga**: $6-12/bulan | **Waktu Setup**: ~20 menit

---

## **OPSI 3: Static Hosting via Spaces (TERMURAH 💰)**

**Cocok untuk**: Pure frontend SPA tanpa backend API.

### Setup
```bash
# Local machine
npm run build

# Upload ke DigitalOcean Spaces (CDN)
# Buat Space → Upload dist/ folder → Enable static site hosting
```

**Harga**: $5/bulan + storage | **Waktu Setup**: ~10 menit

---

## **Perbandingan Cepat**

| Fitur | App Platform | Droplet | Spaces |
|-------|---|---|---|
| **Mudah** | ✅ Sangat | ⚠️ Sedang | ✅ Mudah |
| **Kontrol** | ⚠️ Terbatas | ✅ Penuh | ❌ Minimal |
| **Harga** | $5-12/bulan | $6-12/bulan | $5+/bulan |
| **SSL** | ✅ Auto | ⚠️ Manual | ✅ Auto |
| **Update** | ✅ Auto (git) | ⚠️ Manual | ⚠️ Manual |

---

## **Konfigurasi Environment Variables**

Dapatkan nilai-nilai ini dari:

### Supabase
1. Login ke [supabase.com](https://supabase.com)
2. Pilih project Anda
3. **Settings** → **API**
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`

### Firebase (jika digunakan)
1. Login ke [console.firebase.google.com](https://console.firebase.google.com)
2. Project Settings → General
3. Copy config values

---

## **Troubleshooting**

### ❌ "Application keeps restarting"
```bash
# Check logs
pm2 logs order-dashboard

# Possible fixes
npm install  # Missing dependencies
npm run build  # Build error
```

### ❌ "404 Not Found / Blank page"
```bash
# Issue: React Router tidak handle hash routes di production
# Solution: Sudah dikonfigurasi di vite.config.ts dengan HashRouter
```

### ❌ "Environment variables tidak terbaca"
- Pastikan nama variable dimulai dengan `VITE_`
- Variable harus di-set **sebelum** `npm run build`
- Rebuild project setelah mengganti variables

### ❌ "Port 3000 already in use"
```bash
lsof -i :3000  # Cek siapa yang pakai
kill -9 <PID>  # Kill process
pm2 restart all  # Restart PM2
```

### ❌ "Supabase connection timeout"
- Login ke Supabase Dashboard
- **Settings** → **Network**
- Tambahkan IP droplet ke whitelist
- Atau allow all IPs (development mode)

---

## **Setelah Deployment Berhasil**

✅ **Setup Domain**
- Jika pakai App Platform: Klik "Domains" → Add custom domain
- Jika pakai Droplet: Update DNS records di registrar domain Anda

✅ **Setup HTTPS/SSL**
```bash
# Droplet dengan Certbot
certbot --nginx -d yourdomain.com
```

✅ **Setup Auto-Updates**
```bash
# Droplet: Setup cron job untuk pull latest dari GitHub
crontab -e
# Tambahkan: 0 0 * * * cd /var/www/order-dashboard && git pull && npm install && npm run build && pm2 restart all
```

✅ **Monitor Application**
- App Platform: Dashboard otomatis show metrics
- Droplet: Setup DigitalOcean Monitoring
  ```bash
  apt install -y droplet-agent
  ```

---

## **Quick Reference Commands**

### PM2 Commands (Droplet)
```bash
pm2 logs order-dashboard         # View logs
pm2 restart order-dashboard      # Restart
pm2 stop order-dashboard         # Stop
pm2 start order-dashboard        # Start
pm2 delete order-dashboard       # Remove
pm2 monit                        # Monitor
```

### Nginx Commands
```bash
nginx -t                         # Test config
systemctl restart nginx          # Restart
systemctl stop nginx             # Stop
systemctl status nginx           # Check status
tail -f /var/log/nginx/error.log # View errors
```

### Update Application (Droplet)
```bash
cd /var/www/order-dashboard
git pull origin main
npm install
npm run build
pm2 restart order-dashboard
```

---

## **Pricing Summary**

| Service | Starter | Growth | Detail |
|---------|---------|--------|--------|
| **DigitalOcean Droplet** | $6/mo | $12/mo | 1GB/1vCPU → 2GB/2vCPU |
| **DigitalOcean App Platform** | $12/mo | $25+/mo | Managed, auto-scaling |
| **Supabase (included)** | 500MB DB | 2GB DB | Free tier cukup besar |
| **Domain** | $10-15/yr | | .com, .id, etc |
| **Total Awal** | ~$15-20/mo | | Droplet + domain |

---

## **Recommended Setup untuk Pemula**

1. **Deploy**: Gunakan **App Platform** (termurah, paling mudah)
2. **Database**: Supabase (included, gratis)
3. **Domain**: Beli .com atau .id domain ($10-15/tahun)
4. **Untuk scale**: Upgrade ke Droplet jika traffic naik

---

## **Butuh Bantuan?**

- ❓ Setup issue? Baca troubleshooting di atas
- 📧 Contact DigitalOcean support
- 🔗 Dokumentasi: https://docs.digitalocean.com

**Good luck dengan deployment! 🚀**
