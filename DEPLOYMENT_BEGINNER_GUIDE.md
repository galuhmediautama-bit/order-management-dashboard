# 🚀 PANDUAN DEPLOYMENT BERTAHAP UNTUK PEMULA

**Level**: Beginner-Friendly  
**Durasi**: 30-45 menit  
**Kesulitan**: Mudah (ikuti langkah demi langkah)

---

## 📋 TABLE OF CONTENTS

1. [Persiapan Awal](#persiapan-awal) - Periksa yang Anda punya
2. [Pre-Deployment](#pre-deployment) - Persiapan sebelum upload
3. [Upload Files](#upload-files) - Cara upload ke server
4. [Konfigurasi Server](#konfigurasi-server) - Setup web server
5. [Testing](#testing) - Verifikasi semuanya bekerja
6. [Troubleshooting](#troubleshooting) - Jika ada masalah

---

## 🔍 PERSIAPAN AWAL

### Yang Anda Butuhkan (Checklist)

Sebelum mulai deployment, pastikan Anda punya:

- [ ] **Akses server** (SSH/FTP/cPanel)
- [ ] **Folder upload** (di server production)
- [ ] **Domain sudah dikonfigurasi** (pointing ke server)
- [ ] **SSL/HTTPS ready** (sertifikat sudah terinstall)
- [ ] **Build files** (folder `dist/` sudah ready)

### Cek Yang Anda Punya Sekarang

**Di komputer lokal Anda**, pastikan ada folder ini:
```
d:\order-management-dashboard\dist\
```

Jika belum ada, jalankan:
```bash
cd d:\order-management-dashboard
npm run build
```

**Hasil**: Folder `dist/` muncul dengan isi:
```
dist/
├── index.html
├── assets/
│   ├── ProductFormsPage-xxx.js
│   ├── ProductSalesPage-xxx.js
│   ├── ProductDetailsPage-xxx.js
│   └── [banyak file lainnya]
└── favicon.ico
```

---

## 📱 JENIS SERVER (PILIH YANG ANDA PUNYA)

### Jenis 1: cPanel (Hosting Umum - PALING MUDAH)
- Hosting dengan cPanel interface
- Punya File Manager
- **Cocok untuk: Pemula**
- Langkah: [Lihat OPSI A di bawah](#opsi-a-cpanel-hosting)

### Jenis 2: VPS/Dedicated Server (Linux)
- Akses via SSH terminal
- Lebih control, tapi lebih kompleks
- **Cocok untuk: Intermediate**
- Langkah: [Lihat OPSI B di bawah](#opsi-b-vps-linux)

### Jenis 3: Cloud (AWS, Google Cloud, Azure, DigitalOcean)
- Cloud platform
- Ada dashboard tersendiri
- **Cocok untuk: Advanced**
- Langkah: [Lihat OPSI C di bawah](#opsi-c-cloud)

---

## ⚡ OPSI A: cPANEL HOSTING (PALING MUDAH)

### STEP 1: Buka cPanel

1. Buka browser
2. Pergi ke: `https://your-hosting.com:2083` atau `https://your-hosting.com/cpanel`
3. Login dengan username & password Anda
4. Anda akan melihat dashboard cPanel

**Screenshot reference**:
```
Dashboard cPanel akan menampilkan:
- File Manager
- Databases
- Email
- Addon Domains
- dll
```

---

### STEP 2: Buka File Manager

1. Di cPanel dashboard, cari **"File Manager"**
2. Klik File Manager
3. Pilih "public_html" di sidebar kiri (ini adalah folder web utama)
4. Anda akan melihat folder/file yang ada sekarang

**Atau**: Langsung di sidebar:
```
cPanel → File Manager → public_html
```

---

### STEP 3: Upload Build Files

#### Cara A: Upload via Web Interface (Mudah untuk pemula)

1. **Di cPanel File Manager**:
   - Klik tombol **"Upload"** (di atas)
   - Dialog upload muncul

2. **Di dialog upload**:
   - Klik **"Select File"** atau drag-drop
   - Pergi ke: `d:\order-management-dashboard\dist\`
   - Pilih folder `dist` (jangan file individual)
   - Klik "Open"

3. **Tunggu upload selesai**
   - Progress bar menunjukkan progress
   - Setelah selesai, klik "Close"

---

#### Cara B: Upload via FTP (Jika web upload error)

1. **Download FTP Client** (gratis):
   - FileZilla (recommended)
   - Cyberduck
   - WinSCP

2. **Dapatkan FTP credentials**:
   - Di cPanel, cari "FTP Accounts"
   - Lihat: FTP Host, Username, Password

3. **Setup FTP Client**:
   ```
   Host: ftp.your-domain.com
   Username: [dari FTP Accounts]
   Password: [dari FTP Accounts]
   Port: 21
   ```

4. **Connect dan upload**:
   - Left side: Local computer (`d:\order-management-dashboard\dist\`)
   - Right side: Server (`public_html/`)
   - Drag files dari left ke right
   - Tunggu upload selesai

---

### STEP 4: Struktur Folder di Server

Setelah upload, struktur di `public_html/` seharusnya seperti ini:

```
public_html/
├── index.html              ← Main file (PENTING!)
├── favicon.ico
├── assets/
│   ├── ProductFormsPage-xxx.js
│   ├── ProductSalesPage-xxx.js
│   ├── ProductDetailsPage-xxx.js
│   ├── index-xxx.js        ← Main bundle
│   └── [banyak file .js lainnya]
└── [mungkin ada file lama jika ada]
```

**Verifikasi**:
- [ ] `index.html` ada di `public_html/`
- [ ] Folder `assets/` ada di dalam `public_html/`
- [ ] Minimal ada 50+ files di `assets/`

---

### STEP 5: Setup untuk React Router

React app menggunakan routing (HashRouter). Kita perlu setup server agar routes bekerja.

#### STEP 5A: Edit .htaccess (Paling Mudah)

1. **Di cPanel File Manager**, di folder `public_html/`:
   - Klik kanan → "Create New File"
   - Nama: `.htaccess` (persis begitu, dengan titik di depan)
   - Klik "Create"

2. **Edit file** (klik dua kali file `.htaccess`):
   - Salin kode di bawah:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files and directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite all non-file/directory to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Cache policy
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

<FilesMatch "\.html$">
  Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>
```

3. **Paste** kode ke dalam editor
4. **Save** file

---

### STEP 6: Test Deployment

1. **Buka browser**
2. Pergi ke: `https://your-domain.com` (bukan localhost!)
3. Anda seharusnya melihat aplikasi loading
4. Tunggu sampai UI muncul (mungkin 3-5 detik pertama kali)

#### Jika Ada Error:

**Error 1: Blank Page**
- Buka F12 (Developer Tools)
- Tab "Console" - lihat error messages
- Biasanya ada issue dengan paths

**Error 2: 404 Not Found**
- Berarti `index.html` tidak ditemukan
- Cek ulang struktur folder di Step 4

**Error 3: "Cannot GET /"**
- Berarti `.htaccess` tidak bekerja
- Check apakah `mod_rewrite` enabled di cPanel

---

### STEP 7: Verify Semua Halaman

Setelah berhasil load, test fitur baru:

1. **Login** dengan akun Anda
2. **Pergi ke Products page**
   - Klik menu "Produk" atau "Daftar Produk"
3. **Test dropdown menu** di product manapun
   - Klik product → dropdown muncul
   - Anda lihat 3 opsi baru:
     - ✅ "Lihat Form"
     - ✅ "Penjualan"
     - ✅ "Analytics"

4. **Klik masing-masing**:
   - Lihat Form → Page baru load (forms list)
   - Penjualan → Page baru load (sales metrics)
   - Analytics → Page baru load (analytics dashboard)

5. **Test dark mode**:
   - Klik icon moon/sun (biasanya di atas)
   - UI berubah ke dark/light

6. **Test mobile**:
   - F12 → device toggle (mobile view)
   - Atur ke mobile size
   - Verifikasi layout responsive

---

### STEP 8: Monitor Errors

1. **Di browser F12 (Developer Tools)**:
   - Tab "Console"
   - Lihat ada error atau tidak
   - Catat error message

2. **Di cPanel**:
   - Error Logs: `cPanel` → `Error Log`
   - Lihat ada pesan error atau tidak

3. **Catatan**:
   - Error kecil mungkin OK (warnings)
   - Tapi error besar (red) perlu dicheck

---

## ⚡ OPSI B: VPS/LINUX (INTERMEDIATE)

### STEP 1: Connect via SSH

1. **Buka Terminal/Command Prompt**
2. Jalankan:
```bash
ssh user@your-server-ip
```

3. **Masukkan password** saat diminta

4. **Sekarang Anda di server**
```bash
$ # Ini berarti Anda sudah di server
```

---

### STEP 2: Persiapan Folder

1. **Masuk ke folder web**:
```bash
cd /var/www/html
# ATAU
cd /home/username/public_html
# (tergantung setup server Anda)
```

2. **Buat backup folder lama** (opsional):
```bash
cp -r . ../backup_old
```

3. **Bersihkan folder** (jika ada file lama):
```bash
rm -rf *
```

---

### STEP 3: Upload Files via SCP

Di **komputer lokal Anda**, buka Command Prompt/Terminal dan jalankan:

```bash
# Windows PowerShell
scp -r "d:\order-management-dashboard\dist\*" user@your-server-ip:/var/www/html/

# atau Mac/Linux
scp -r ~/order-management-dashboard/dist/* user@your-server-ip:/var/www/html/
```

**Perhatian**: Ganti:
- `user` dengan username SSH Anda
- `your-server-ip` dengan IP server Anda
- `/var/www/html/` dengan path web folder Anda

---

### STEP 4: Verify Upload

Di server (SSH terminal), jalankan:

```bash
ls -la /var/www/html/

# Seharusnya melihat:
# -rw-r--r-- index.html
# drwxr-xr-x assets
# -rw-r--r-- favicon.ico
```

---

### STEP 5: Configure Nginx atau Apache

#### Jika menggunakan Nginx:

1. **Edit config file**:
```bash
sudo nano /etc/nginx/sites-available/default
```

2. **Cari blok "server"** dan pastikan ada:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;
    
    # HashRouter support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **Test config**:
```bash
sudo nginx -t
```

4. **Restart Nginx**:
```bash
sudo systemctl restart nginx
```

---

#### Jika menggunakan Apache:

1. **Enable mod_rewrite**:
```bash
sudo a2enmod rewrite
```

2. **Edit `.htaccess`** (di `/var/www/html/`):
```bash
cat > /var/www/html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
EOF
```

3. **Restart Apache**:
```bash
sudo systemctl restart apache2
```

---

### STEP 6: Setup SSL (HTTPS)

```bash
# Menggunakan Let's Encrypt (gratis)
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

---

### STEP 7: Test

```bash
# Test dari server
curl https://your-domain.com/

# Seharusnya return index.html content
```

---

## ⚡ OPSI C: CLOUD (AWS, Google Cloud, DigitalOcean, Azure)

### Untuk Cloud, langkah berbeda. Hubungi tim cloud Anda untuk:

1. Upload `dist/` folder ke cloud storage
2. Configure CDN jika ada
3. Configure domain pointing
4. Setup SSL certificate

**Atau gunakan dokumentasi official mereka**:
- AWS: Deploy ke S3 + CloudFront
- Google Cloud: Deploy ke Cloud Storage
- DigitalOcean: Deploy ke App Platform atau Droplet
- Azure: Deploy ke Static Web Apps

---

## 🧪 TESTING (SEMUA OPSI)

### Test 1: Check App Loads

1. **Di browser, buka**: `https://your-domain.com`
2. **Verifikasi**:
   - [ ] Halaman load tanpa blank page
   - [ ] UI muncul (tidak error)
   - [ ] Login form muncul (jika belum login)

---

### Test 2: Check New Features

1. **Login ke app**
2. **Pergi ke Produk**
3. **Buka product dropdown**
4. **Verify 3 opsi muncul**:
   - [ ] "Lihat Form"
   - [ ] "Penjualan"
   - [ ] "Analytics"

---

### Test 3: Test Navigation

1. **Klik "Lihat Form"**:
   - [ ] Page load (URL ubah ke `/produk/123/forms`)
   - [ ] List forms muncul
   - [ ] Tombol "View/Edit/Unlink" ada

2. **Klik "Penjualan"**:
   - [ ] Page load (URL ubah ke `/produk/123/sales`)
   - [ ] 5 metric boxes muncul (Orders, Revenue, dll)
   - [ ] Orders table muncul

3. **Klik "Analytics"**:
   - [ ] Page load (URL ubah ke `/produk/123/details`)
   - [ ] 7 metric cards muncul
   - [ ] Quick links ada

---

### Test 4: Dark Mode

1. **Cari icon dark/light mode** (biasanya di top-right)
2. **Toggle dark mode**
3. **Verify** semua page berubah warna

---

### Test 5: Mobile

1. **Di browser, tekan F12**
2. **Klik "Toggle device toolbar"** (icon mobile di atas)
3. **Pilih size mobile** (iPhone, dll)
4. **Verify** layout responsive (tidak ada overflow)

---

### Test 6: Performance

1. **Di browser F12**
2. **Tab "Network"**
3. **Refresh page**
4. **Lihat**:
   - [ ] Load time (seharusnya < 3 detik)
   - [ ] Total size (seharusnya < 2 MB)
   - [ ] No red errors

---

## 🆘 TROUBLESHOOTING

### Problem 1: Blank White Page

**Gejala**: Page load tapi blank/kosong

**Solusi**:
1. Buka F12 (Developer Tools)
2. Tab "Console"
3. Catat error message
4. Paling sering:
   ```
   Error: Cannot find module 'xyz'
   ```
   **Berarti**: File .js tidak di-upload dengan benar

**Fix**:
```bash
# Di komputer lokal
cd d:\order-management-dashboard
npm run build  # Rebuild
# Upload ulang dist/ folder
```

---

### Problem 2: 404 Not Found

**Gejala**: Browser error "Cannot GET /"

**Solusi**:
1. **Check `index.html` ada atau tidak**
   - Di cPanel: File Manager → lihat `index.html`
   - Di Linux: `ls -la /var/www/html/index.html`

2. **Jika tidak ada**:
   - Upload ulang `dist/` folder

3. **Jika ada**:
   - Cek `.htaccess` setup (Step 5A/5B)

---

### Problem 3: Routes Tidak Bekerja

**Gejala**: Klik link, page blank atau 404

**Solusi**:
1. **Cek `.htaccess` di place** yang benar
   - Di cPanel: `public_html/.htaccess`
   - Di Linux: `/var/www/html/.htaccess`

2. **Verify `.htaccess` content**:
   ```
   RewriteEngine On
   RewriteRule ^ index.html [L]
   ```

3. **Jika masih error**:
   - Contact hosting support
   - Tanya: "Apache mod_rewrite enabled?"

---

### Problem 4: Product Pages Not Loading

**Gejala**: Klik "Lihat Form" tapi page blank

**Solusi**:
1. **Cek console errors** (F12)
2. **Paling sering**:
   ```
   Supabase connection error
   ```
   **Berarti**: Database connection bermasalah
   
3. **Fix**:
   - Verifikasi Supabase credentials
   - Cek URL/API key di `firebase.ts`

---

### Problem 5: Slow Loading

**Gejala**: Page load lambat (> 5 detik)

**Solusi**:
1. **Check server resources**
   - CPU usage
   - Memory usage
   - Disk space

2. **Enable caching**:
   ```apache
   # Di .htaccess
   <FilesMatch "\.(js|css)$">
     Header set Cache-Control "max-age=31536000"
   </FilesMatch>
   ```

3. **Upgrade hosting** jika terlalu lambat

---

### Problem 6: HTTPS/SSL Error

**Gejala**: Browser warning "Not Secure"

**Solusi untuk cPanel**:
1. Di cPanel → AutoSSL
2. Klik "Run AutoSSL"
3. Tunggu process selesai

**Solusi untuk VPS**:
```bash
sudo certbot renew
```

---

## ✅ DEPLOYMENT SUCCESS CHECKLIST

Jika sudah selesai semua, verifikasi:

- [ ] App load di `https://your-domain.com`
- [ ] Login berhasil
- [ ] Products page muncul
- [ ] Dropdown menu ada 3 opsi baru
- [ ] Semua 3 halaman baru bekerja
- [ ] Dark mode toggle bekerja
- [ ] Mobile responsive bekerja
- [ ] No console errors (F12)
- [ ] Performance OK (< 3 detik load)

**Jika semua centang**: ✅ **DEPLOYMENT SUKSES!**

---

## 📞 BANTUAN LEBIH LANJUT

### Jika Ada Error & Tidak Bisa Fix:

1. **Catat error message**:
   - F12 → Console → Copy error

2. **Catat langkah yang dilakukan**:
   - "Saya pakai cPanel"
   - "Upload via File Manager"
   - "Edit .htaccess"
   - dst

3. **Contact**:
   - Hosting support
   - Development team
   - Tim DevOps perusahaan

---

## 📚 ADDITIONAL RESOURCES

**Untuk mempelajari lebih lanjut**:
- `DEPLOYMENT_GUIDE_PRODUCTION.md` - Detail teknis
- `HYBRID_DEPLOYMENT_ACTION_PLAN.md` - Rencana keseluruhan
- `PHASE_2_PLANNING.md` - Apa selanjutnya

---

## 🎉 SELAMAT!

Jika sudah selesai deployment, Anda sudah:
- ✅ Deploy 3 halaman baru ke production
- ✅ Setup server dengan benar
- ✅ Konfigurasi routing
- ✅ Test semua fitur

**Next Step**: Monitor production untuk 1 minggu dan kumpulkan feedback untuk Phase 2!

---

**Panduan Deployment untuk Pemula**: December 7, 2025  
**Level**: Beginner-Friendly  
**Status**: Ready to Follow

Jika ada pertanyaan, tanyakan! Saya siap membantu! 🚀
