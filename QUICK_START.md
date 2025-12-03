# ⚡ Quick Start - 5 Menit Setup

## 🎯 Development (Lokal)

### 1. Install & Setup (2 menit)
```powershell
# Install dependencies
npm install

# Copy environment template
Copy-Item .env.example .env.local
```

### 2. Isi Credentials (1 menit)
Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://ggxyaautsdukyapstlgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...  # Ganti dengan key Anda
```

**Dapatkan dari**: Supabase Dashboard → Settings → API

### 3. Run! (1 menit)
```powershell
npm run dev
```

Buka: http://localhost:3000

---

## 🚀 Production (DigitalOcean)

### Method 1: App Platform (10 menit)

```powershell
# 1. Push to GitHub
git add .
git commit -m "Deploy"
git push

# 2. Di DigitalOcean:
# - Create App → Connect GitHub
# - Build: npm install && npm run build
# - Run: npx vite preview --host 0.0.0.0 --port 8080

# 3. Set Environment Variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key

# 4. Deploy!
```

### Method 2: Manual Droplet
Lihat: `DEPLOYMENT_START_HERE.md`

---

## 🗄️ Database (Supabase)

### Setup Tables (5 menit)
Di Supabase SQL Editor, jalankan **berurutan**:
1. `supabase_create_orders_table.sql`
2. `supabase_forms_table_complete.sql`
3. `supabase_add_user_columns.sql`
4. `supabase_add_commission_columns.sql`

### Setup Security (2 menit) ⚠️ WAJIB!
```sql
-- Di Supabase SQL Editor
```
Jalankan: `supabase_rls_policies.sql`

---

## ✅ Checklist

### Development
- [ ] `npm install` berhasil
- [ ] `.env.local` sudah diisi
- [ ] `npm run dev` berjalan
- [ ] Bisa login/register

### Database
- [ ] Tables sudah dibuat
- [ ] RLS policies sudah dijalankan
- [ ] Auth provider enabled

### Production
- [ ] Environment variables di-set
- [ ] Build & deploy berhasil
- [ ] HTTPS aktif
- [ ] App bisa diakses

---

## 🆘 Error?

| Error | Solusi |
|-------|--------|
| Credentials tidak ditemukan | Cek `.env.local` ada dan benar |
| Permission denied | Jalankan `supabase_rls_policies.sql` |
| Build gagal | Cek env vars di DigitalOcean |
| Cannot connect | Cek Supabase URL & key benar |

**Detail lengkap**: `SETUP_GUIDE.md`

---

**Selesai! 🎉** Lihat `SETUP_GUIDE.md` untuk panduan lengkap.
