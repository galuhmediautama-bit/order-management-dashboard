# 🌐 Setup Domain & SSL Certificate (Namecheap PositiveSSL)

## 📋 Prerequisites
- Domain sudah dibeli di Namecheap
- PositiveSSL certificate sudah dibeli di Namecheap
- Digital Ocean Droplet IP: `143.198.87.240`
- SSH Access ke server

---

## 1️⃣ SETUP DNS DI NAMECHEAP

### Login ke Namecheap Dashboard
1. Login ke https://www.namecheap.com
2. Go to **Domain List** → Pilih domain Anda
3. Klik **Manage** → **Advanced DNS**

### Tambahkan DNS Records
Tambahkan record berikut:

| Type  | Host | Value              | TTL       |
|-------|------|--------------------|-----------|
| A     | @    | 143.198.87.240     | Automatic |
| A     | www  | 143.198.87.240     | Automatic |
| CNAME | *    | yourdomain.com     | Automatic |

**Contoh jika domain Anda: `orderdash.com`**
```
A Record     @      → 143.198.87.240
A Record     www    → 143.198.87.240
CNAME        *      → orderdash.com
```

**⏰ Tunggu propagasi DNS: 15 menit - 48 jam** (biasanya 30 menit)

---

## 2️⃣ VERIFY DNS SUDAH AKTIF

Buka PowerShell dan cek:

```powershell
# Ganti yourdomain.com dengan domain Anda
nslookup yourdomain.com

# Harus menunjukkan IP: 143.198.87.240
```

Atau cek di browser:
```
http://yourdomain.com
```

---

## 3️⃣ INSTALL CERTBOT DI SERVER

SSH ke server:

```powershell
ssh -i "C:\Users\alan2014\.ssh\digitalocean_rsa" root@143.198.87.240
```

Install Certbot:

```bash
# Update packages
apt update

# Install Certbot untuk Nginx
apt install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
```

---

## 4️⃣ UPDATE NGINX CONFIGURATION

Edit Nginx config untuk domain:

```bash
nano /etc/nginx/sites-available/order-management
```

**Ubah dari:**
```nginx
server_name 143.198.87.240;
```

**Menjadi:**
```nginx
server_name yourdomain.com www.yourdomain.com;
```

**Contoh lengkap:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/order-management/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

Test dan reload:
```bash
nginx -t
systemctl reload nginx
```

---

## 5️⃣ GENERATE SSL CERTIFICATE (Let's Encrypt)

### Opsi A: Menggunakan Let's Encrypt (GRATIS, Auto-Renew)

```bash
# Generate certificate untuk domain Anda
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Ikuti prompt:
# - Masukkan email Anda
# - Accept Terms of Service (Y)
# - Share email with EFF (N atau Y, terserah)
# - Redirect HTTP to HTTPS? (2 - Yes, redirect)
```

Certbot akan otomatis:
- Generate SSL certificate
- Update Nginx config
- Setup auto-renewal

Verify SSL:
```bash
certbot certificates
```

**SSL akan otomatis renew setiap 90 hari.**

---

## 6️⃣ SETUP NAMECHEAP POSITIVSSL (Alternative Berbayar)

### A. Generate CSR di Server

```bash
# Buat directory untuk SSL
mkdir -p /etc/ssl/certs/orderdash
cd /etc/ssl/certs/orderdash

# Generate private key
openssl genrsa -out yourdomain.com.key 2048

# Generate CSR (Certificate Signing Request)
openssl req -new -key yourdomain.com.key -out yourdomain.com.csr
```

**Isi informasi CSR:**
```
Country Name: ID
State: Jawa Barat (atau provinsi Anda)
Locality: Bandung (atau kota Anda)
Organization: Nama Perusahaan Anda
Organizational Unit: IT Department
Common Name: yourdomain.com
Email: admin@yourdomain.com
Challenge Password: [kosongkan]
```

**Copy CSR:**
```bash
cat yourdomain.com.csr
```

### B. Activate PositiveSSL di Namecheap

1. Login Namecheap → **SSL Certificates** → **Activate**
2. Paste CSR yang sudah di-copy
3. Pilih **HTTP File-Based** validation
4. Pilih web server: **NGINX**
5. Approve notification email: Pilih `admin@yourdomain.com`

### C. Domain Validation

Namecheap akan berikan file `.txt` untuk validasi:

```bash
# Di server, buat directory untuk validation
mkdir -p /var/www/order-management/dist/.well-known/pki-validation

# Upload file validasi (nama file dari Namecheap)
nano /var/www/order-management/dist/.well-known/pki-validation/XXXXXXXX.txt

# Paste content dari Namecheap
# Save: Ctrl+O, Enter, Ctrl+X
```

Update Nginx untuk allow `.well-known`:
```bash
nano /etc/nginx/sites-available/order-management
```

Tambahkan:
```nginx
location /.well-known/pki-validation/ {
    root /var/www/order-management/dist;
    allow all;
}
```

Reload Nginx:
```bash
nginx -t
systemctl reload nginx
```

Test access:
```
http://yourdomain.com/.well-known/pki-validation/XXXXXXXX.txt
```

### D. Download Certificate dari Namecheap

Setelah validasi approved (5-30 menit):

1. Download ZIP file dari Namecheap
2. Extract, Anda akan dapat:
   - `yourdomain_com.crt` (certificate)
   - `yourdomain_com.ca-bundle` (intermediate certificates)

### E. Upload Certificate ke Server

```powershell
# Di PowerShell lokal, upload certificate
scp -i "C:\Users\alan2014\.ssh\digitalocean_rsa" yourdomain_com.crt root@143.198.87.240:/etc/ssl/certs/orderdash/
scp -i "C:\Users\alan2014\.ssh\digitalocean_rsa" yourdomain_com.ca-bundle root@143.198.87.240:/etc/ssl/certs/orderdash/
```

### F. Combine Certificate

```bash
# SSH ke server
ssh -i "C:\Users\alan2014\.ssh\digitalocean_rsa" root@143.198.87.240

# Combine certificate dengan CA bundle
cd /etc/ssl/certs/orderdash
cat yourdomain_com.crt yourdomain_com.ca-bundle > yourdomain_com_bundle.crt

# Set permissions
chmod 600 yourdomain.com.key
chmod 644 yourdomain_com_bundle.crt
```

### G. Update Nginx untuk SSL

```bash
nano /etc/nginx/sites-available/order-management
```

**Update menjadi:**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/orderdash/yourdomain_com_bundle.crt;
    ssl_certificate_key /etc/ssl/certs/orderdash/yourdomain.com.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (Optional but recommended)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    root /var/www/order-management/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

Test dan restart:
```bash
nginx -t
systemctl restart nginx
```

---

## 7️⃣ ALLOW HTTPS IN FIREWALL

```bash
ufw allow 443/tcp
ufw status
```

---

## 8️⃣ VERIFY SSL CERTIFICATE

### Test di Browser
```
https://yourdomain.com
```

### Check SSL dengan OpenSSL
```bash
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Online SSL Checker
- https://www.ssllabs.com/ssltest/
- Paste: `yourdomain.com`
- Klik **Submit**
- Target rating: **A atau A+**

---

## 9️⃣ AUTO-RENEWAL SSL

### Let's Encrypt (Otomatis)
Sudah auto-renew. Test renewal:
```bash
certbot renew --dry-run
```

### Namecheap PositiveSSL (Manual)
- PositiveSSL valid 1 tahun
- 30 hari sebelum expired, repeat **Step 6** untuk renew

Set reminder di calendar:
```
Reminder: Renew SSL Certificate
Date: [1 tahun dari sekarang - 30 hari]
```

---

## 🔟 UPDATE GITHUB WORKFLOW

Update `.github/workflows/deploy.yml` agar deploy ke domain:

```yaml
name: Deploy to Digital Ocean

on:
  push:
    branches: [main, master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USERNAME }}
          key: ${{ secrets.DO_SSH_KEY }}
          source: "dist/*,package.json,package-lock.json"
          target: "/var/www/order-management"
      
      - name: Restart Application
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USERNAME }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /var/www/order-management
            npm ci --production
            pm2 restart order-management || pm2 start npm --name "order-management" -- start
            nginx -t && systemctl reload nginx
```

---

## 📝 CHECKLIST

- [ ] DNS A Record added untuk @ dan www
- [ ] DNS propagasi selesai (cek dengan nslookup)
- [ ] Nginx config updated dengan domain name
- [ ] SSL Certificate installed (Let's Encrypt atau PositiveSSL)
- [ ] HTTPS berfungsi di browser
- [ ] HTTP redirect ke HTTPS
- [ ] Firewall allow port 443
- [ ] SSL Test score A/A+ di SSLLabs
- [ ] Auto-renewal setup (Let's Encrypt) atau reminder (PositiveSSL)
- [ ] GitHub workflow tested dengan domain baru

---

## 🆘 TROUBLESHOOTING

### DNS not resolving
```bash
# Clear DNS cache (Windows)
ipconfig /flushdns

# Check propagasi global
# https://www.whatsmydns.net/
```

### SSL certificate error
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/orderdash/yourdomain_com_bundle.crt -text -noout

# Check Nginx SSL config
nginx -t
```

### Mixed content warning
Update all hardcoded URLs di code dari `http://` ke `https://` atau gunakan relative URLs.

---

## 📚 REFERENSI

- Certbot: https://certbot.eff.org/
- Namecheap SSL: https://www.namecheap.com/support/knowledgebase/subcategory/68/ssl-certificates/
- SSL Labs: https://www.ssllabs.com/ssltest/
- Nginx SSL: https://nginx.org/en/docs/http/configuring_https_servers.html

---

## ✅ HASIL AKHIR

Setelah selesai, aplikasi Anda akan:

✅ Accessible via: `https://yourdomain.com`  
✅ SSL Certificate: Valid & Trusted  
✅ Auto-redirect: HTTP → HTTPS  
✅ Security Grade: A/A+ (SSLLabs)  
✅ Auto-Deploy: Working dengan domain baru  

**🎉 Selamat! Domain dan SSL sudah terpasang!**
