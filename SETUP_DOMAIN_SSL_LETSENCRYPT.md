# 🔒 Setup Domain & SSL dengan Let's Encrypt (GRATIS)

**Server IP:** 143.198.87.240

---

## 1️⃣ SETUP DNS DI NAMECHEAP (5 menit)

1. Login ke https://www.namecheap.com
2. **Domain List** → Pilih domain → **Manage**
3. **Advanced DNS** → Tambahkan records:

```
Type: A Record
Host: @
Value: 143.198.87.240
TTL: Automatic

Type: A Record  
Host: www
Value: 143.198.87.240
TTL: Automatic
```

**⏰ Tunggu 15-30 menit untuk DNS propagasi**

---

## 2️⃣ CEK DNS SUDAH AKTIF

Di PowerShell lokal:

```powershell
# Ganti yourdomain.com dengan domain Anda
nslookup yourdomain.com

# Harus muncul: 143.198.87.240
```

Atau test di browser:
```
http://yourdomain.com
```

Kalau sudah muncul website (walau http), lanjut step 3.

---

## 3️⃣ INSTALL CERTBOT DI SERVER

SSH ke server:

```powershell
ssh -i "C:\Users\alan2014\.ssh\digitalocean_rsa" root@143.198.87.240
```

Install Certbot:

```bash
# Update package list
apt update

# Install Certbot + Nginx plugin
apt install certbot python3-certbot-nginx -y

# Verify
certbot --version
```

---

## 4️⃣ UPDATE NGINX CONFIG DENGAN DOMAIN

```bash
# Edit Nginx config
nano /etc/nginx/sites-available/order-management
```

**Ubah baris `server_name`:**

DARI:
```nginx
server_name 143.198.87.240;
```

MENJADI (ganti yourdomain.com):
```nginx
server_name yourdomain.com www.yourdomain.com;
```

**Save:** Ctrl+O → Enter → Ctrl+X

Test & reload:
```bash
nginx -t
systemctl reload nginx
```

---

## 5️⃣ GENERATE SSL CERTIFICATE (1 command!)

```bash
# Ganti yourdomain.com dengan domain Anda
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Ikuti prompt:**
1. **Email:** Masukkan email Anda (untuk renewal reminder)
2. **Terms of Service:** `Y` (yes)
3. **Share email with EFF:** `N` (no) atau `Y` (terserah)
4. **Redirect HTTP to HTTPS:** `2` (Yes, redirect semua ke HTTPS)

**Certbot akan otomatis:**
- ✅ Generate SSL certificate
- ✅ Update Nginx config untuk HTTPS
- ✅ Setup auto-renewal (setiap 90 hari)
- ✅ Reload Nginx

**Selesai!** SSL sudah aktif.

---

## 6️⃣ ALLOW HTTPS DI FIREWALL

```bash
ufw allow 443/tcp
ufw status
```

---

## 7️⃣ VERIFY SSL BERFUNGSI

### Test di browser:
```
https://yourdomain.com
```

Harus muncul 🔒 (gembok hijau)

### Check SSL info:
```bash
certbot certificates
```

Harus muncul info:
```
Certificate Name: yourdomain.com
  Domains: yourdomain.com www.yourdomain.com
  Expiry Date: 2025-03-03 (89 days)
  Certificate Path: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
  Private Key Path: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

---

## 8️⃣ TEST AUTO-RENEWAL

```bash
# Dry run renewal (test saja, tidak benar-benar renew)
certbot renew --dry-run
```

Kalau sukses, muncul:
```
Congratulations, all simulated renewals succeeded
```

**Auto-renewal sudah aktif!** Certificate akan otomatis renew 30 hari sebelum expired.

---

## 9️⃣ CHECK SSL RATING (Optional)

1. Buka: https://www.ssllabs.com/ssltest/
2. Masukkan: `yourdomain.com`
3. Klik **Submit**
4. Tunggu 2-3 menit
5. **Target Score: A atau A+** ✅

---

## 🔟 LOGOUT DARI SERVER

```bash
exit
```

---

## ✅ SELESAI!

Website Anda sekarang:

✅ **URL:** https://yourdomain.com  
✅ **SSL:** Active & Trusted  
✅ **Security:** A/A+ Rating  
✅ **Auto-Redirect:** HTTP → HTTPS  
✅ **Auto-Renewal:** Setiap 90 hari  
✅ **Cost:** $0 (GRATIS selamanya!)  

---

## 📋 TROUBLESHOOTING

### ❌ DNS belum resolve
```powershell
# Clear DNS cache di Windows
ipconfig /flushdns

# Tunggu 30-60 menit lagi untuk propagasi
```

### ❌ Certbot error: "Failed authorization"
- Pastikan domain sudah pointing ke 143.198.87.240
- Pastikan port 80 terbuka: `ufw allow 80/tcp`
- Pastikan Nginx running: `systemctl status nginx`

### ❌ "Too many certificates"
Let's Encrypt limit: 5 cert/domain per minggu. Tunggu 1 minggu.

### ❌ Mixed content warning di browser
Cari hardcoded `http://` di code, ubah jadi `https://` atau relative URL.

---

## 🔄 MANUAL RENEWAL (Jarang Butuh)

Auto-renewal biasanya jalan otomatis. Kalau mau manual:

```bash
ssh -i "C:\Users\alan2014\.ssh\digitalocean_rsa" root@143.198.87.240
certbot renew
systemctl reload nginx
exit
```

---

## 📞 SUPPORT

- Let's Encrypt Docs: https://letsencrypt.org/docs/
- Certbot Docs: https://certbot.eff.org/
- Community: https://community.letsencrypt.org/

---

**🎉 Congratulations! SSL setup completed!**
