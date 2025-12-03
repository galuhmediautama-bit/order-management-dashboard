# 📋 Step-by-Step Setup - Order Management Dashboard

Ikuti langkah-langkah berikut **secara berurutan** untuk setup aplikasi dari nol hingga production.

---

## 🎯 BAGIAN 1: SETUP DEVELOPMENT (LOKAL)

### ✅ Step 1: Clone & Install (5 menit)

```powershell
# 1. Clone repository (jika belum)
git clone <your-repo-url>
cd order-management-dashboard

# 2. Install dependencies
npm install

# 3. Tunggu hingga selesai (bisa 2-5 menit)
# Anda akan lihat "added XXX packages"
```

**Verifikasi:**
```powershell
# Cek apakah folder node_modules sudah ada
Test-Path node_modules
# Harus return: True
```

---

### ✅ Step 2: Setup Supabase Project (10 menit)

#### 2.1 Buat Project Supabase

1. Buka browser, kunjungi: https://supabase.com
2. Klik **"Start your project"** atau **"Sign In"**
3. Login dengan GitHub/Google/Email
4. Klik **"New Project"**
5. Isi data:
   - **Name**: order-management-dashboard (atau nama lain)
   - **Database Password**: Buat password kuat (SIMPAN INI!)
   - **Region**: Singapore (atau terdekat dengan Anda)
   - **Pricing Plan**: Free (untuk testing)
6. Klik **"Create new project"**
7. **Tunggu 2-3 menit** hingga database ready

#### 2.2 Ambil Credentials

1. Di Supabase Dashboard, klik **Settings** (icon gear) di sidebar
2. Klik **API**
3. Copy 2 nilai ini:
   - **Project URL** → Contoh: `https://xxxyyyzz.supabase.co`
   - **anon public** key → String panjang mulai dengan `eyJhbGciOi...`

**SIMPAN KEDUA NILAI INI!** Anda akan butuh di langkah berikutnya.

---

### ✅ Step 3: Setup Environment Variables (2 menit)

```powershell
# 1. Copy template environment file
Copy-Item .env.example .env.local

# 2. Buka file dengan text editor
notepad .env.local
```

#### 3.1 Edit `.env.local`

Ganti isi file dengan credentials Supabase Anda:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxyyyzz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...

# Gemini API (Optional - bisa diabaikan dulu)
GEMINI_API_KEY=
```

**Penting:**
- Ganti `https://xxxyyyzz.supabase.co` dengan **Project URL** Anda
- Ganti `eyJhbGciOi...` dengan **anon public key** Anda
- Pastikan **TIDAK ADA SPASI** di awal/akhir

#### 3.2 Save & Close

- Tekan `Ctrl + S` untuk save
- Close notepad

**Verifikasi:**
```powershell
# Cek apakah file .env.local ada
Test-Path .env.local
# Harus return: True
```

---

### ✅ Step 4: Setup Database Tables (10 menit)

#### 4.1 Buka SQL Editor

1. Di Supabase Dashboard, klik **SQL Editor** di sidebar
2. Klik **"New query"**

#### 4.2 Jalankan SQL Files (Berurutan!)

**File 1: Create Orders Table**
```powershell
# 1. Buka file di VS Code atau notepad
notepad supabase_create_orders_table.sql
```
- Copy **SEMUA ISI** file
- Paste di SQL Editor Supabase
- Klik **"Run"** (atau tekan `Ctrl + Enter`)
- Tunggu muncul "Success. No rows returned"

**File 2: Create Forms Table**
```powershell
notepad supabase_forms_table_complete.sql
```
- Copy semua isi
- Paste di SQL Editor (query baru)
- Klik **"Run"**

**File 3: Add User Columns**
```powershell
notepad supabase_add_user_columns.sql
```
- Copy, paste, run

**File 4: Add Commission Columns**
```powershell
notepad supabase_add_commission_columns.sql
```
- Copy, paste, run

**File 5: Add Product Images**
```powershell
notepad supabase_add_product_images.sql
```
- Copy, paste, run

#### 4.3 Verifikasi Tables Sudah Dibuat

Di Supabase, klik **Table Editor** di sidebar. Anda harus lihat tables:
- ✅ orders
- ✅ users
- ✅ forms
- ✅ abandoned_carts
- ✅ ad_campaigns
- ✅ settings

---

### ✅ Step 5: Setup Row Level Security (5 menit) 🔒

**SANGAT PENTING untuk keamanan!**

#### 5.1 Jalankan RLS Policies

```powershell
# Buka file RLS policies
notepad supabase_rls_policies.sql
```

1. Copy **SEMUA ISI** file
2. Di Supabase SQL Editor, buat query baru
3. Paste semua kode
4. Klik **"Run"**
5. Tunggu hingga selesai (~10-20 detik)
6. Akan muncul: "Success. X rows returned" atau similar

#### 5.2 Verifikasi RLS Aktif

Di SQL Editor, jalankan query ini:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'users', 'forms', 'abandoned_carts', 'ad_campaigns', 'settings');
```

**Result yang benar:**
```
tablename          | rowsecurity
-------------------|-------------
orders             | true
users              | true
forms              | true
abandoned_carts    | true
ad_campaigns       | true
settings           | true
```

Semua harus `true`! Jika ada yang `false`, ulangi Step 5.1.

---

### ✅ Step 6: Setup Authentication (3 menit)

#### 6.1 Enable Email Auth

1. Di Supabase Dashboard, klik **Authentication** di sidebar
2. Klik **Providers**
3. Cari **Email** provider
4. Pastikan toggle **Enabled** = ON (hijau)

#### 6.2 Configure Site URL

1. Klik **URL Configuration**
2. Set **Site URL**: `http://localhost:3000`
3. Set **Redirect URLs**, tambahkan:
   ```
   http://localhost:3000/#/dashboard
   http://localhost:3000
   ```
4. Klik **Save**

---

### ✅ Step 7: Run Development Server (1 menit)

```powershell
# Jalankan dev server
npm run dev
```

**Output yang benar:**
```
VITE v6.2.0  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

#### 7.1 Buka di Browser

1. Buka browser
2. Kunjungi: http://localhost:3000
3. Anda akan lihat halaman Login

---

### ✅ Step 8: Create First User (2 menit)

#### 8.1 Register User Pertama

1. Di halaman login, klik **"Register"** atau **"Daftar"**
2. Isi form:
   - **Name**: Admin
   - **Email**: admin@example.com
   - **Password**: password123 (ganti dengan password kuat!)
3. Klik **"Register"**

#### 8.2 Aktivasi User

User baru akan berstatus **"Tidak Aktif"** (pending approval).

**Cara aktivasi manual via SQL:**

```sql
-- Di Supabase SQL Editor, jalankan:
UPDATE users 
SET status = 'Aktif', role = 'Super Admin' 
WHERE email = 'admin@example.com';
```

Atau via **Table Editor**:
1. Klik **Table Editor** → **users**
2. Cari user dengan email Anda
3. Klik row tersebut
4. Edit:
   - `status` → `Aktif`
   - `role` → `Super Admin`
5. Save

#### 8.3 Login

1. Refresh browser atau klik **Login**
2. Login dengan email dan password Anda
3. Anda akan masuk ke Dashboard! 🎉

---

### ✅ Step 9: Test Aplikasi (5 menit)

#### 9.1 Test Navigation

Klik menu di sidebar:
- ✅ Dashboard
- ✅ Pesanan
- ✅ Pelanggan
- ✅ Formulir
- ✅ Pengaturan

#### 9.2 Test Create Order

1. Klik **Pesanan**
2. Klik **"+ Tambah Order"**
3. Isi form order
4. Klik **"Simpan"**
5. Order muncul di list? ✅

#### 9.3 Test Create Form

1. Klik **Formulir**
2. Klik **"+ Buat Formulir"**
3. Isi:
   - Judul: "Test Product"
   - Gambar: Upload gambar produk
   - Harga: 100000
4. Klik **"Simpan"**
5. Form muncul di list? ✅

---

## 🚀 BAGIAN 2: DEPLOYMENT KE PRODUCTION

### ✅ Step 10: Prepare for Deployment (5 menit)

#### 10.1 Update Site URL di Supabase

1. Di Supabase → **Authentication** → **URL Configuration**
2. Update **Site URL** dengan domain production Anda:
   ```
   https://yourdomain.com
   ```
3. Update **Redirect URLs**, tambahkan:
   ```
   https://yourdomain.com/#/dashboard
   https://yourdomain.com
   ```
4. Save

#### 10.2 Test Build Locally

```powershell
# Test build production
npm run build

# Jika berhasil, folder 'dist' akan dibuat
Test-Path dist
# Harus return: True

# Test preview production build
npm run preview
```

Buka http://localhost:4173 untuk test build production.

---

### ✅ Step 11: Push to GitHub (3 menit)

```powershell
# 1. Add semua file
git add .

# 2. Commit
git commit -m "Ready for production deployment"

# 3. Push ke GitHub
git push origin main
```

**Jika belum setup Git:**
```powershell
# Init git
git init

# Add remote (ganti dengan URL repo Anda)
git remote add origin https://github.com/yourusername/your-repo.git

# Add, commit, push
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

### ✅ Step 12: Deploy to DigitalOcean App Platform (15 menit)

#### 12.1 Create Account & Login

1. Buka https://cloud.digitalocean.com
2. Sign up (jika belum punya account)
3. Verifikasi email
4. Add payment method (kartu kredit - akan ada trial $200 untuk 60 hari)

#### 12.2 Create App

1. Klik **"Create"** (tombol hijau di kanan atas)
2. Pilih **"Apps"**
3. Klik **"Create App"**

#### 12.3 Connect GitHub

1. **Source**: Pilih **GitHub**
2. Klik **"Authorize DigitalOcean"**
3. Login GitHub dan approve access
4. **Repository**: Pilih repo Anda
5. **Branch**: `main`
6. **Source Directory**: `/` (root)
7. **Autodeploy**: ✅ Yes (centang jika mau auto-deploy on push)
8. Klik **"Next"**

#### 12.4 Configure Resources

1. **Resource Type**: Web Service (sudah otomatis detect)
2. **Name**: order-management-dashboard (atau nama lain)
3. **Environment**: Node.js
4. **Build Command**:
   ```bash
   npm install && npm run build
   ```
5. **Run Command**:
   ```bash
   npx vite preview --host 0.0.0.0 --port 8080
   ```
6. **HTTP Port**: 8080
7. **Output Directory**: `dist`
8. Klik **"Next"**

#### 12.5 Set Environment Variables 🔒

**SANGAT PENTING!**

1. Scroll ke **"Environment Variables"**
2. Klik **"Edit"**
3. Tambahkan variables (klik "+ Add More" untuk setiap variable):

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://xxxyyyzz.supabase.co` (ganti dengan URL Supabase Anda)
   - Type: Plain text (atau Encrypted untuk lebih aman)

   **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOi...` (paste anon key Supabase Anda)
   - Type: **Encrypted** (Recommended!)

   **Variable 3 (Optional):**
   - Key: `GEMINI_API_KEY`
   - Value: (API key Gemini jika punya)
   - Type: Encrypted

4. Klik **"Save"**
5. Klik **"Next"**

#### 12.6 Review & Create

1. **Region**: Singapore (atau terdekat)
2. **Plan**: Basic ($5/month) atau Pro ($12/month)
   - Basic: 512MB RAM, 1 vCPU (cukup untuk testing)
   - Pro: 1GB RAM, 1 vCPU (recommended untuk production)
3. Review semua settings
4. Klik **"Create Resources"**

#### 12.7 Wait for Deployment

1. Deployment akan mulai otomatis
2. Anda akan lihat **"Building..."** → **"Deploying..."**
3. Tunggu **5-10 menit**
4. Status akan berubah jadi **"Deployed"** (hijau)

#### 12.8 Get Your App URL

1. Di App detail page, lihat section **"Live App"**
2. URL Anda akan seperti: `https://your-app-xxxxx.ondigitalocean.app`
3. Klik URL untuk buka aplikasi
4. **Test login dan semua fitur!**

---

### ✅ Step 13: Setup Custom Domain (Optional, 10 menit)

#### 13.1 Add Domain di DigitalOcean

1. Di App settings, klik **"Domains"**
2. Klik **"Add Domain"**
3. Masukkan domain Anda: `yourdomain.com`
4. Klik **"Add Domain"**

#### 13.2 Update DNS Records

DigitalOcean akan memberikan DNS records. Di domain provider Anda (Namecheap, GoDaddy, dll):

1. Login ke domain provider
2. Manage DNS untuk domain Anda
3. Tambahkan records (yang diberikan DigitalOcean):
   - Type: **CNAME**
   - Name: **@** (atau www)
   - Value: `your-app-xxxxx.ondigitalocean.app`
   - TTL: Automatic

4. Save DNS changes
5. **Tunggu 5-60 menit** untuk DNS propagation

#### 13.3 Enable HTTPS

1. Di DigitalOcean App → **Domains**
2. Tunggu hingga SSL certificate issued (otomatis dari Let's Encrypt)
3. Status akan berubah jadi **"Active"** dengan icon lock 🔒
4. Akses domain Anda dengan **https://**

---

### ✅ Step 14: Final Testing & Verification (10 menit)

#### 14.1 Test Production App

1. **Buka app** di browser (domain atau .ondigitalocean.app URL)
2. **Test Login**:
   - ✅ Bisa login dengan user yang sudah dibuat
3. **Test CRUD Operations**:
   - ✅ Create order
   - ✅ Edit order
   - ✅ Delete order
   - ✅ Create form
   - ✅ View form public URL (test `/f/:formId`)
4. **Test Upload**:
   - ✅ Upload gambar produk di form editor
5. **Test Dashboard**:
   - ✅ Dashboard menampilkan data (chart, stats)

#### 14.2 Test Public Form

1. Klik **Formulir**
2. Pilih salah satu form
3. Klik **"View"** atau copy public URL
4. Buka di **incognito/private window**
5. Test isi form dan submit
6. Order masuk ke dashboard? ✅

#### 14.3 Check Security

Di Supabase → **Authentication** → **Users**:
- ✅ Hanya user yang login yang bisa akses dashboard
- ✅ RLS policies berfungsi (user hanya lihat data sesuai role)

Di browser console (F12):
- ✅ Tidak ada error merah
- ✅ API calls ke Supabase berhasil (200 OK)

---

### ✅ Step 15: Monitoring & Maintenance (Ongoing)

#### 15.1 Monitor Logs

**DigitalOcean:**
1. Apps → Your App → **Runtime Logs**
2. Lihat logs untuk error/issues

**Supabase:**
1. Dashboard → **Logs**
2. Monitor database queries

#### 15.2 Setup Alerts (Optional)

Di DigitalOcean:
1. Apps → Your App → **Alerts**
2. Setup alert untuk:
   - High CPU usage
   - High memory usage
   - Deployment failures

#### 15.3 Regular Backups

**Database:**
- Supabase otomatis backup database (daily)
- Check: Dashboard → **Database** → **Backups**

**Code:**
- Push code changes ke GitHub regularly
- Use Git tags untuk mark releases

---

## ✅ CHECKLIST LENGKAP

### Development Setup
- [ ] Node.js installed
- [ ] Repository cloned
- [ ] npm install berhasil
- [ ] Supabase project created
- [ ] .env.local configured
- [ ] 5 SQL files dijalankan
- [ ] RLS policies aktif
- [ ] Authentication configured
- [ ] npm run dev berjalan
- [ ] First user created & activated
- [ ] Dashboard accessible
- [ ] Create order works
- [ ] Create form works

### Production Deployment
- [ ] Site URL updated di Supabase
- [ ] npm run build berhasil
- [ ] Code pushed to GitHub
- [ ] DigitalOcean account created
- [ ] App created & connected to GitHub
- [ ] Build & run commands configured
- [ ] Environment variables set
- [ ] App deployed successfully
- [ ] App accessible via URL
- [ ] HTTPS active
- [ ] Custom domain configured (optional)
- [ ] SSL certificate issued (optional)
- [ ] All features tested in production
- [ ] Public form works
- [ ] Security verified

---

## 🎉 SELESAI!

Aplikasi Anda sekarang:
✅ Running di development (localhost:3000)
✅ Deployed di production (DigitalOcean)
✅ Database secured dengan RLS
✅ HTTPS enabled
✅ Siap digunakan!

---

## 🆘 Troubleshooting

Jika ada masalah di langkah manapun, lihat:
- **SETUP_GUIDE.md** - Troubleshooting section
- **SECURITY.md** - Security issues
- **DEPLOYMENT_START_HERE.md** - Deployment details

Atau cek error di:
- Browser console (F12)
- DigitalOcean Runtime Logs
- Supabase Logs

---

**Happy deploying! 🚀**
