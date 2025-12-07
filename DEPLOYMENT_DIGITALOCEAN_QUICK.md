# 🚀 UPDATE WEB PRODUCTION DI DIGITALOCEAN (QUICK & SIMPLE)

**Status**: Web sudah live di DigitalOcean  
**Tujuan**: Update dengan fitur baru (Product Pages)  
**Durasi**: 5-10 menit  
**Kesulitan**: Mudah

---

## ⚡ LANGKAH-LANGKAH (IKUTI SATU PER SATU)

### STEP 1: Build File Lokal (Di Komputer Anda)

Buka Command Prompt/PowerShell di folder project:

```powershell
cd d:\order-management-dashboard
npm run build
```

**Tunggu sampai selesai**. Anda akan lihat:
```
✓ 873 modules transformed
✓ built in 5.22s
```

**Hasil**: Folder `dist/` dibuat dengan semua file production.

---

### STEP 2: Ambil SSH Details DigitalOcean

1. Buka **DigitalOcean dashboard**
2. Pergi ke **Droplet** atau **App Platform**
3. Cari server Anda (nama app atau droplet)
4. Ambil:
   - **IP Address** atau **Hostname**
   - **Username** (biasanya `root` atau `appuser`)

**Contoh**:
```
IP: 123.45.67.89
Username: root
```

---

### STEP 3: Connect ke Server via SSH

Di Command Prompt/PowerShell, jalankan:

```powershell
ssh root@123.45.67.89
```

Ganti `123.45.67.89` dengan IP Anda.

**Saat diminta password**: Masukkan password SSH atau tekan Enter jika pakai SSH key.

**Hasil**: Anda akan lihat prompt seperti:
```
root@production:~#
```

---

### STEP 4: Backup File Lama (Optional tapi RECOMMENDED)

Di terminal SSH, jalankan:

```bash
cd /root/order-management-dashboard
# atau path dimana app Anda
# tanyakan ke tim DevOps jika tidak tahu

# Backup folder lama
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)
```

**Hasil**: Folder lama di-backup dengan nama `dist.backup.20250607_143022` (dengan timestamp).

---

### STEP 5: Upload File Baru

**Kembali ke Command Prompt lokal Anda** (jangan di SSH terminal):

```powershell
# Windows
scp -r "d:\order-management-dashboard\dist\*" root@123.45.67.89:/root/order-management-dashboard/dist/

# atau Mac/Linux
# scp -r ~/order-management-dashboard/dist/* root@123.45.67.89:/root/order-management-dashboard/dist/
```

**Ganti**:
- `root` dengan username Anda
- `123.45.67.89` dengan IP Anda
- `/root/order-management-dashboard/dist/` dengan path production app Anda

**Tunggu sampai upload selesai** (bisa 30 detik - 2 menit).

---

### STEP 6: Verify File Upload

Di SSH terminal (jika sudah disconnect, SSH lagi):

```bash
ssh root@123.45.67.89
cd /root/order-management-dashboard/dist

ls -la
# Seharusnya lihat index.html, assets/ folder, dll

ls -la assets/ | head -20
# Seharusnya lihat banyak .js files
```

---

### STEP 7: Restart Web App

Di SSH terminal:

**Jika pakai DigitalOcean App Platform**:
```bash
# Tidak perlu manual restart, deploy otomatis
# Tapi bisa manual:
doctl apps restart <APP_ID>
# atau di dashboard: klik Restart
```

**Jika pakai Droplet dengan Nginx/Apache**:
```bash
# Nginx
sudo systemctl restart nginx

# atau Apache
sudo systemctl restart apache2
```

**Jika pakai PM2** (process manager):
```bash
pm2 restart all
# atau
pm2 restart app-name
```

---

### STEP 8: Test di Browser

1. Buka browser
2. Pergi ke: `https://your-domain.com` (domain Anda di DigitalOcean)
3. Verifikasi:
   - [ ] App load (tidak blank page)
   - [ ] Bisa login
   - [ ] Dashboard normal

4. **Test fitur baru**:
   - Pergi ke **Products page**
   - Buka dropdown product manapun
   - Lihat 3 opsi baru:
     - [ ] "Lihat Form"
     - [ ] "Penjualan"
     - [ ] "Analytics"
   - Klik masing-masing → harus load

5. **Check performance**:
   - F12 (Developer Tools)
   - Tab "Network"
   - Refresh
   - Lihat loading time (seharusnya < 3 detik)

---

### STEP 9: Check Error Logs

Jika ada masalah, lihat logs:

**Di SSH terminal**:

```bash
# Jika pakai Nginx
sudo tail -50 /var/log/nginx/error.log

# Jika pakai Apache
sudo tail -50 /var/log/apache2/error.log

# Jika pakai PM2
pm2 logs
```

**Catat error message** dan cari solusi di troubleshooting.

---

## ✅ VERIFIKASI SUKSES

Setelah selesai, cek:

- [ ] App load di production domain
- [ ] Products page ada (menu Products visible)
- [ ] Dropdown product muncul
- [ ] 3 opsi baru ada (Forms, Sales, Analytics)
- [ ] Klik opsi → halaman load
- [ ] No red errors di F12 console
- [ ] Load time < 3 detik

**Jika semua OK**: ✅ **DEPLOYMENT SUKSES!**

---

## 🆘 QUICK TROUBLESHOOTING

### Problem: Blank Page

**Solusi**:
1. F12 → Console → lihat error
2. SSH ke server → cek error logs
3. Verify `dist/index.html` ada

---

### Problem: 404 Not Found

**Solusi**:
1. Verify upload berhasil: `ls -la /root/order-management-dashboard/dist/`
2. Cek `.htaccess` atau Nginx config setup untuk routing
3. Restart web server

---

### Problem: Fitur Lama Masih Terlihat

**Solusi**:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
2. Clear browser cache: F12 → Application → Clear storage
3. Tunggu 5 menit (cache CDN mungkin masih old version)

---

### Problem: Upload Lambat atau Error

**Solusi via SFTP** (lebih stabil):

1. Download FileZilla (gratis)
2. Setup SFTP connection:
   ```
   Host: 123.45.67.89
   Port: 22
   Username: root
   Password: [SSH password]
   ```
3. Connect
4. Drag `dist/` folder dari lokal ke `/root/order-management-dashboard/`

---

## 📝 COMMAND REFERENCE

**Komputer Lokal**:
```powershell
# Build
npm run build

# Upload (SCP)
scp -r "d:\order-management-dashboard\dist\*" root@123.45.67.89:/root/order-management-dashboard/dist/
```

**Di Server SSH**:
```bash
# Navigate to app folder
cd /root/order-management-dashboard

# Verify files
ls -la dist/

# Restart web server
sudo systemctl restart nginx
# atau
pm2 restart all

# Check logs
sudo tail -50 /var/log/nginx/error.log
```

---

## 🎯 NEXT STEPS

1. **Jika berhasil** → Monitor untuk 1 minggu
2. **Kumpulkan feedback** → Apa yang user suka/tidak suka
3. **Lanjut Phase 2** → Lihat PHASE_2_PLANNING.md

---

**Quick Deploy Guide untuk DigitalOcean**: December 7, 2025  
**Status**: Ready to Execute  
**Time**: 5-10 minutes

Mari deploy! 🚀
