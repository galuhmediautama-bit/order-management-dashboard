# ⚡ QUICK DEPLOYMENT CHECKLIST - DIGITAL OCEAN

**Untuk update web yang sudah ada di DigitalOcean**

---

## 🎯 PILIH OPSI ANDA

### Jika App Platform (Paling Mudah)
- URL: `https://[app-name].ondigitalocean.app`

```
✅ OPSI 1: Via GitHub Push (Rekomendasi)
   Cukup: git push → DigitalOcean otomatis deploy

✅ OPSI 2: Via Upload ZIP
   1. Build: npm run build
   2. Zip dist/ → Upload ke DigitalOcean
   3. Deploy
   
⏱️ Waktu: 5-10 menit
```

---

### Jika Droplet / VPS
- Akses: `ssh user@xxx.xxx.xxx.xxx`

```
✅ OPSI 1: Via SCP Upload
   1. Build: npm run build
   2. Upload: scp dist/* user@ip:/var/www/html/
   3. Restart Nginx: sudo systemctl restart nginx
   
⏱️ Waktu: 5-10 menit
```

---

## 📋 STEP BY STEP (SEMUA OPSI)

### STEP 1: Build
```bash
cd d:\order-management-dashboard
npm run build
```
✅ Tunggu sampai selesai (5 detik)

---

### STEP 2: Deploy (Pilih salah satu)

#### Opsi A: GitHub Push (App Platform)
```bash
git add -A
git commit -m "🚀 Deploy: Product pages update"
git push origin main
```
→ DigitalOcean otomatis deploy dalam 2-5 menit

---

#### Opsi B: ZIP Upload (App Platform)
1. Di `d:\order-management-dashboard\dist\`
2. Select all files → Kanan klik → Compress
3. Upload `dist.zip` ke DigitalOcean
4. DigitalOcean deploy dalam 2-5 menit

---

#### Opsi C: SCP Upload (Droplet)
```bash
scp -r "d:\order-management-dashboard\dist\*" user@xxx.xxx.xxx.xxx:/var/www/html/
ssh user@xxx.xxx.xxx.xxx "sudo systemctl restart nginx"
```
✅ Deploy selesai dalam 1 menit

---

### STEP 3: Verify

1. Buka: `https://your-domain.com` atau `.ondigitalocean.app`
2. Check:
   - [ ] Page load (tidak blank)
   - [ ] Login OK
   - [ ] Produk dropdown ada 3 opsi baru
   - [ ] F12 Console: no red errors

✅ Jika semua OK → **DEPLOYMENT SUKSES!**

---

## 🆘 JIKA ADA ERROR

| Error | Solusi |
|-------|--------|
| Deploy failed | Lihat logs di DigitalOcean dashboard |
| Blank page | F12 → Console → catat error |
| 404 routes | Verify HTTP routes config di App Platform |
| Connection refused | Cek SSH key / IP address |

---

**Waktu Total**: 15-20 menit  
**Kesulitan**: Mudah  
**Status**: Production Ready

📖 Detail lengkap: Lihat `DEPLOYMENT_DIGITALOCEAN_BEGINNER.md`
