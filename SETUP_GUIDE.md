# 🚀 Setup Guide - Order Management Dashboard

## 📋 Daftar Isi
1. [Development Setup (Lokal)](#development-setup)
2. [Database Setup (Supabase)](#database-setup)
3. [Production Deployment (DigitalOcean)](#production-deployment)
4. [Verifikasi & Testing](#verifikasi)

---

## 🔧 Development Setup

### Step 1: Clone & Install Dependencies
```powershell
# Clone repository (jika belum)
git clone <your-repo-url>
cd order-management-dashboard

# Install dependencies
npm install
```

### Step 2: Setup Environment Variables
```powershell
# Copy template environment file
Copy-Item .env.example .env.local

# Edit .env.local dengan text editor favorit Anda
notepad .env.local
```

**Isi `.env.local` dengan:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API (Optional)
GEMINI_API_KEY=your-gemini-api-key-here
```

**Cara mendapatkan Supabase credentials:**
1. Login ke https://supabase.com
2. Pilih project Anda (atau buat baru)
3. Klik **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Step 3: Run Development Server
```powershell
npm run dev
```

Server akan berjalan di: http://localhost:3000

---

## 🗄️ Database Setup (Supabase)

### Step 1: Buat Database Tables

Login ke Supabase Dashboard → SQL Editor, lalu jalankan script berikut **secara berurutan**:

#### 1. Create Orders Table
```powershell
# Copy isi file dan jalankan di Supabase SQL Editor
```
Jalankan: `supabase_create_orders_table.sql`

#### 2. Create Forms Table
Jalankan: `supabase_forms_table_complete.sql`

#### 3. Add User Columns
Jalankan: `supabase_add_user_columns.sql`

#### 4. Add Commission Columns
Jalankan: `supabase_add_commission_columns.sql`

#### 5. Add Product Images
Jalankan: `supabase_add_product_images.sql`

### Step 2: Setup Row Level Security (RLS) ⚠️ PENTING!

**WAJIB untuk production security!**

```powershell
# Jalankan di Supabase SQL Editor
```
Jalankan: `supabase_rls_policies.sql`

Script ini akan:
- ✅ Enable RLS pada semua tabel
- ✅ Setup policies untuk role-based access
- ✅ Proteksi data per user role (Admin, CS, Advertiser, dll)

### Step 3: Setup Authentication

Di Supabase Dashboard:
1. **Authentication** → **Settings**
2. Enable **Email provider**
3. Set **Site URL**: `https://your-domain.com` (production) atau `http://localhost:3000` (dev)
4. Set **Redirect URLs**:
   - `https://your-domain.com/#/dashboard`
   - `http://localhost:3000/#/dashboard`

### Step 4: Setup Storage (untuk upload gambar)

1. **Storage** → **Create Bucket**
2. Nama: `product-images`
3. Make it **Public**
4. Set CORS policy jika perlu

---

## 🌐 Production Deployment (DigitalOcean)

### Opsi 1: DigitalOcean App Platform (Recommended - Paling Mudah)

#### Step 1: Push ke GitHub
```powershell
git add .
git commit -m "Ready for production"
git push origin main
```

#### Step 2: Create App di DigitalOcean
1. Login ke https://cloud.digitalocean.com
2. Klik **Create** → **Apps**
3. **Connect GitHub** → Pilih repository Anda
4. **Branch**: main
5. **Auto Deploy**: Yes (optional)

#### Step 3: Configure Build Settings
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Run Command**: 
  ```bash
  npx vite preview --host 0.0.0.0 --port 8080
  ```
- **Output Directory**: `dist`

#### Step 4: Set Environment Variables ⚠️ PENTING!
Di DigitalOcean App Settings → **Environment Variables**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-key (optional)
```

**JANGAN lupa klik "Encrypt" untuk sensitive values!**

#### Step 5: Deploy!
Klik **Create Resources** dan tunggu deployment selesai (~5-10 menit)

### Opsi 2: DigitalOcean Droplet (Manual)

Lihat panduan lengkap di: `DEPLOYMENT_START_HERE.md`

---

## ✅ Verifikasi & Testing

### 1. Development (Lokal)
```powershell
# Cek TypeScript errors
npx tsc --noEmit

# Run dev server
npm run dev
```

**Test checklist:**
- [ ] Bisa buka http://localhost:3000
- [ ] Bisa login/register
- [ ] Bisa create order
- [ ] Bisa create form
- [ ] Dashboard menampilkan data

### 2. Database (Supabase)

**Cek RLS Status:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'users', 'forms', 'abandoned_carts');
```
Semua harus return `rowsecurity = true`

**Test Policy:**
```sql
-- Test sebagai user biasa
SELECT * FROM orders;  -- Harus hanya tampil orders user tsb
```

### 3. Production (DigitalOcean)

**Test checklist:**
- [ ] App bisa diakses via URL
- [ ] HTTPS aktif (SSL certificate)
- [ ] Login/Register berfungsi
- [ ] Create order/form berfungsi
- [ ] Upload gambar berfungsi
- [ ] Tracking pixels aktif (Meta, Google, dll)

**Monitoring:**
```powershell
# Cek logs di DigitalOcean
# Apps → Your App → Runtime Logs
```

---

## 🔐 Security Checklist (Production)

Sebelum go-live, pastikan:

- [ ] **RLS enabled** di semua tabel Supabase
- [ ] **Environment variables** di-set di DigitalOcean (tidak hardcoded)
- [ ] **HTTPS/SSL** aktif
- [ ] **Supabase anon key** yang digunakan (bukan service_role key!)
- [ ] **CORS** di-set di Supabase
- [ ] **Rate limiting** aktif di Supabase
- [ ] **Email verification** enabled (optional)
- [ ] **.env.local** di-gitignore (tidak ter-commit)

---

## 🆘 Troubleshooting

### Error: "Supabase credentials tidak ditemukan"
**Solusi**: Pastikan `.env.local` ada dan berisi credentials yang benar

### Error: "Permission denied" di database
**Solusi**: Jalankan `supabase_rls_policies.sql` untuk setup RLS policies

### Error: "Cannot connect to Supabase"
**Solusi**: 
1. Cek `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` benar
2. Cek Supabase project masih aktif
3. Cek koneksi internet

### Build error di DigitalOcean
**Solusi**:
1. Cek environment variables sudah di-set
2. Cek build command benar
3. Lihat build logs untuk detail error

### Form tidak bisa diakses public
**Solusi**: 
1. Pastikan RLS policy untuk `forms` table mengizinkan `SELECT` untuk public
2. Jalankan:
```sql
CREATE POLICY "Public can view forms" ON forms
  FOR SELECT USING (true);
```

---

## 📚 Dokumentasi Tambahan

- **COMMISSION_SYSTEM.md** - Panduan sistem komisi ganda
- **SECURITY.md** - Panduan keamanan lengkap
- **DEPLOYMENT_START_HERE.md** - Deployment detail
- **MULTI_LANGUAGE_GUIDE.md** - Setup multi-bahasa
- **.github/copilot-instructions.md** - Panduan untuk AI agents

---

## 📞 Bantuan

Jika mengalami kesulitan:
1. Cek file `TROUBLESHOOTING_*.md`
2. Cek Supabase logs di Dashboard
3. Cek DigitalOcean build/runtime logs
4. Review `SECURITY.md` untuk masalah akses

---

**Happy coding! 🎉**
