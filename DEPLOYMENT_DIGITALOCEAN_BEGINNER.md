# 🚀 DEPLOYMENT GUIDE - DIGITAL OCEAN (BERTAHAP UNTUK PEMULA)

**Platform**: DigitalOcean  
**Level**: Beginner-Friendly  
**Durasi**: 15-25 menit  
**Status**: Web sudah di DigitalOcean

---

## 📋 CHECKLIST AWAL

Sebelum mulai, pastikan Anda punya:

- [ ] **DigitalOcean Account** (sudah login)
- [ ] **App atau Droplet** yang sudah running
- [ ] **Domain** sudah pointing ke DigitalOcean
- [ ] **Build files ready** (dist/ folder)

---

## 🔍 CEK SETUP DIGITAL OCEAN ANDA SEKARANG

### Tipe 1: App Platform (PALING MUDAH - RECOMMENDED)

Jika web Anda di **DigitalOcean App Platform**:

```
DigitalOcean Dashboard 
    → Apps 
    → [Lihat nama app Anda]
    → Live App: https://[your-app-name].ondigitalocean.app
```

**Ciri-ciri App Platform**:
- Domain auto: `[app-name].ondigitalocean.app`
- Deploy via GitHub / Upload file
- Auto SSL/HTTPS
- Paling simple untuk pemula

---

### Tipe 2: Droplet (VPS)

Jika web Anda di **DigitalOcean Droplet** (VPS):

```
DigitalOcean Dashboard 
    → Droplets 
    → [Lihat nama droplet Anda]
    → IP address: xxx.xxx.xxx.xxx
```

**Ciri-ciri Droplet**:
- Punya IP address
- Bisa SSH ke droplet
- Perlu setup Nginx/Apache sendiri
- Lebih control, tapi lebih kompleks

---

## 🚀 OPSI 1: DIGITAL OCEAN APP PLATFORM (PALING MUDAH)

### STEP 1: Siapkan Build Files

Di komputer lokal Anda:

```bash
cd d:\order-management-dashboard
npm run build
```

**Seharusnya ada folder**:
```
d:\order-management-dashboard\dist\
├── index.html
├── favicon.ico
└── assets/
```

---

### STEP 2: Buka DigitalOcean Dashboard

1. Buka: https://cloud.digitalocean.com
2. Login dengan akun Anda
3. Di sidebar kiri, klik **"Apps"**
4. Lihat list app yang sudah ada
5. **Klik app Anda** yang mana web-nya

---

### STEP 3: Setup Deployment

Ada 3 cara untuk update app:

#### CARA A: Upload via ZIP (PALING MUDAH UNTUK PEMULA)

1. **Di komputer lokal**:
   - Pergi ke folder: `d:\order-management-dashboard\dist\`
   - Pilih semua file dalam folder ini (Ctrl+A)
   - Klik kanan → "Send to" → "Compressed (zipped) folder"
   - Hasil: File `dist.zip`

2. **Di DigitalOcean Dashboard**:
   - Klik app Anda
   - Cari tab "Settings" atau "Deploy"
   - Cari button "Upload Files" atau "Upload Artifact"
   - Klik button tersebut
   - Pilih file `dist.zip` dari komputer

3. **Tunggu proses selesai** (biasanya 2-5 menit)

---

#### CARA B: Deploy via GitHub (RECOMMENDED untuk jangka panjang)

1. **Push code ke GitHub**:
   ```bash
   cd d:\order-management-dashboard
   git add .
   git commit -m "🚀 Deploy new product pages to DigitalOcean"
   git push origin main
   ```

2. **Di DigitalOcean Dashboard**:
   - Apps → App Anda
   - Settings → GitHub
   - Connect GitHub account (jika belum)
   - Select repository: `order-management-dashboard`
   - Select branch: `main`
   - Save

3. **Setiap kali ada push ke main**, DigitalOcean otomatis deploy!

---

#### CARA C: Deploy via CLI (Untuk Advanced)

```bash
# Install doctl CLI
# (skip jika sudah install)

# Login
doctl auth init

# Deploy
doctl apps create-deployment [APP_ID] --source-type git
```

---

### STEP 4: Configure App (PENTING!)

Setelah upload/connect, perlu setup agar React Router bekerja.

1. **Di DigitalOcean App Dashboard**:
   - Klik app Anda
   - Tab **"Settings"** atau **"Configure"**
   - Cari **"Buildpack"** atau **"Web Service"** settings

2. **Pastikan ada HTTP Routes**:
   ```
   Path: /*
   Target: index.html
   ```

3. **Atau cari "Static Site" settings**:
   ```
   Source: dist/
   Output Directory: /
   HTTP Routes:
     Path: /*
     File: index.html
   ```

4. **Save & Deploy**

---

### STEP 5: Verify Deploy Status

1. **Di DigitalOcean Dashboard**:
   - Apps → App Anda
   - Tab **"Activity"** atau **"Deployments"**
   - Lihat status:
     - 🔵 **In Progress** = Sedang deploy
     - 🟢 **Succeeded** = Deploy berhasil!
     - 🔴 **Failed** = Ada error

2. **Tunggu sampai 🟢 Succeeded**

---

### STEP 6: Test Aplikasi

1. **Buka browser**:
   ```
   https://[your-app-name].ondigitalocean.app
   ```
   
   Atau jika punya custom domain:
   ```
   https://your-domain.com
   ```

2. **Test fitur**:
   - [ ] Page load (tidak blank)
   - [ ] Login bekerja
   - [ ] Produk page muncul
   - [ ] 3 opsi dropdown muncul (Lihat Form, Penjualan, Analytics)
   - [ ] Klik masing-masing bisa navigate

3. **Check F12 Console**:
   - Tidak ada red errors
   - Warning OK, error tidak OK

---

### STEP 7: Setup Custom Domain (Jika Punya)

Jika punya domain custom (bukan `ondigitalocean.app`):

1. **Di DigitalOcean**:
   - Apps → App Anda
   - Tab **"Settings"**
   - Cari **"Domain"** atau **"Custom Domain"**
   - Klik **"Add Domain"**
   - Input domain Anda: `your-domain.com`

2. **Di Domain Provider** (Namecheap, IDWebhost, dll):
   - Update DNS records
   - Arahkan ke DigitalOcean nameservers atau CNAME
   - (DigitalOcean akan kasih instruksi spesifik)

3. **Tunggu DNS propagate** (15 menit - 24 jam)

4. **Verify**:
   ```
   https://your-domain.com
   ```

---

### STEP 8: Enable SSL/HTTPS

Di DigitalOcean App Platform, SSL auto-setup!

1. **Check di DigitalOcean**:
   - Apps → App Anda
   - Settings → SSL
   - Seharusnya status: **"Active"** ✅

2. **Jika belum**:
   - Klik **"Enable SSL"**
   - Tunggu beberapa menit

3. **Verify**:
   - Buka https://your-app.ondigitalocean.app
   - Check address bar: 🔒 Padlock muncul

---

## 🚀 OPSI 2: DIGITAL OCEAN DROPLET (VPS) - INTERMEDIATE

### STEP 1: Connect ke Droplet via SSH

1. **Di DigitalOcean Dashboard**:
   - Droplets → Droplet Anda
   - Lihat IP address: `xxx.xxx.xxx.xxx`
   - Lihat username: `root` atau `ubuntu`

2. **Di komputer Anda, buka Terminal/PowerShell**:
   ```bash
   ssh root@xxx.xxx.xxx.xxx
   # atau
   ssh ubuntu@xxx.xxx.xxx.xxx
   ```

3. **Masukkan password** (DigitalOcean kirim via email)

4. **Selesai, sekarang Anda di droplet**:
   ```
   root@droplet:~#
   ```

---

### STEP 2: Setup Web Server

Droplet biasanya sudah ada Nginx. Cek:

```bash
nginx -v
```

Jika tidak ada, install:

```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
```

---

### STEP 3: Upload Build Files

Di komputer lokal, upload `dist/` folder:

```bash
scp -r d:\order-management-dashboard\dist\* root@xxx.xxx.xxx.xxx:/var/www/html/
```

Ganti `xxx.xxx.xxx.xxx` dengan IP DigitalOcean Anda.

---

### STEP 4: Configure Nginx

Di droplet, edit Nginx config:

```bash
sudo nano /etc/nginx/sites-available/default
```

Ganti dengan:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    root /var/www/html;
    index index.html;

    # React Router - HashRouter support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache policy untuk static files
    location ~* \.(js|css|png|jpg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Save**: Ctrl+X → Y → Enter

---

### STEP 5: Test & Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### STEP 6: Setup SSL/HTTPS

Gunakan Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
sudo systemctl restart nginx
```

---

### STEP 7: Test

```bash
curl https://your-domain.com
```

Seharusnya return HTML content dari `index.html`.

---

## 🧪 TESTING CHECKLIST

Jika sudah deploy, test ini:

### Test 1: App Load
- [ ] Buka URL di browser
- [ ] UI muncul (tidak blank)
- [ ] Tidak ada red errors di F12 Console

### Test 2: New Features
- [ ] Login berhasil
- [ ] Pergi ke Produk
- [ ] Dropdown ada 3 opsi baru
- [ ] Klik masing-masing navigate bekerja

### Test 3: Performance
- [ ] Page load < 3 detik
- [ ] F12 Network tab: total size < 2 MB
- [ ] Responsif di mobile

### Test 4: Dark Mode
- [ ] Toggle dark mode bekerja
- [ ] Semua page berubah warna

### Test 5: Offline
- [ ] Service worker working (jika ada)
- [ ] Cache working

---

## 🆘 TROUBLESHOOTING DIGITAL OCEAN

### Problem 1: Deploy Failed (DigitalOcean App)

**Gejala**: Status "Failed" di Deployments tab

**Solusi**:
1. Klik deployment yang failed
2. Lihat "Logs" tab
3. Catat error message
4. Paling umum:
   - `dist/index.html not found` → Upload ulang files
   - `Build failed` → Cek build command

---

### Problem 2: Blank Page

**Gejala**: Page load tapi blank

**Solusi**:
1. F12 Console → catat error
2. Biasanya masalah dengan routes
3. Verify `.htaccess` atau Nginx routing benar

---

### Problem 3: Droplet SSH Connection Refused

**Gejala**: `ssh: connect to host ... refused`

**Solusi**:
1. Verify IP address benar
2. Cek SSH port (default 22)
3. Droplet mungkin reboot, tunggu 1 menit

---

### Problem 4: 404 After Deploy

**Gejala**: Deploy sukses tapi akses URL dapat 404

**Solusi untuk App Platform**:
1. Check HTTP Routes config
2. Pastikan ada rule: `Path: /*` → `File: index.html`

**Solusi untuk Droplet**:
1. Check Nginx config
2. Pastikan `try_files $uri $uri/ /index.html;`

---

### Problem 5: SSL Certificate Error

**Gejala**: Browser warning "Not Secure"

**Solusi untuk App Platform**:
1. Settings → SSL
2. Klik "Enable SSL"
3. Tunggu beberapa menit

**Solusi untuk Droplet**:
```bash
sudo certbot renew
sudo systemctl restart nginx
```

---

## 📊 MONITORING PRODUCTION

Setelah deploy, monitor ini:

### 1. Cek Logs (App Platform)

```
DigitalOcean → Apps → App Anda → Logs
```

Lihat:
- Error messages
- Warning (warning OK, error tidak OK)

### 2. Cek Logs (Droplet)

```bash
sudo tail -f /var/log/nginx/access.log
```

### 3. Monitor Uptime

- Google Analytics
- Uptime monitoring tool (Pingdom, Datadog, dll)

### 4. Check Performance

```
DigitalOcean → Apps → App Anda → Metrics
```

Lihat:
- CPU usage (seharusnya < 20%)
- Memory usage (seharusnya < 50%)

---

## ✅ DEPLOYMENT SUCCESS CHECKLIST

- [ ] Build files uploaded ke DigitalOcean
- [ ] App deployed (status "Succeeded")
- [ ] URL accessible di browser
- [ ] No blank pages atau 404 errors
- [ ] New features working (3 product pages)
- [ ] SSL/HTTPS working (🔒 padlock)
- [ ] Dark mode toggle working
- [ ] Mobile responsive
- [ ] No red errors di F12 Console

**Jika semua centang**: ✅ **DEPLOYMENT KE DIGITAL OCEAN SUKSES!**

---

## 📝 ROLLBACK (Jika Ada Masalah)

Jika perlu rollback ke versi sebelumnya:

### Di App Platform:

1. Apps → App Anda
2. Tab **"Deployments"**
3. Klik deployment sebelumnya
4. Klik **"Rollback"**

### Di Droplet:

```bash
# Backup yang lama
cp -r /var/www/html /var/www/html.backup

# Restore dari git
cd /var/www
git clone [repo-url]
cd repo
git checkout [commit-hash]
npm run build
cp dist/* /var/www/html/
```

---

## 🚀 NEXT STEPS (PHASE 2)

Setelah deploy berhasil:

1. **Monitor 1 minggu** - Catat error, performance
2. **Kumpulkan feedback** - User punya request?
3. **Implement Phase 2** - Analytics, charts, filtering, dll

---

## 📞 BUTUH BANTUAN?

### Jika Ada Error:

1. **Catat error message** - Screenshot atau copy-paste
2. **Catat langkah yang dilakukan** - Opsi 1 atau 2?
3. **Contact support**:
   - DigitalOcean support: https://www.digitalocean.com/support
   - Team development: Tim DevOps perusahaan

### Useful Links:

- DigitalOcean Docs: https://docs.digitalocean.com
- App Platform Guide: https://docs.digitalocean.com/products/app-platform
- Droplet Docs: https://docs.digitalocean.com/products/droplets

---

## 🎉 SELAMAT!

Aplikasi sudah di DigitalOcean dengan 3 halaman baru!

**Status**: 🟢 Production Ready

**Next Phase**: Monitor + Phase 2 Features Implementation

---

**Deployment Guide DigitalOcean**: December 7, 2025  
**Level**: Beginner-Friendly  
**Target Audience**: Pemula yang menggunakan DigitalOcean
