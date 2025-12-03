# 🔒 Security Guidelines

## Masalah Keamanan yang Sudah Diperbaiki

### ✅ 1. Environment Variables
- Credentials Supabase sekarang menggunakan environment variables
- File `.env.local` tidak ter-commit ke Git (sudah di `.gitignore`)
- Template tersedia di `.env.example`

### ✅ 2. API Keys Protection
- Supabase anon key aman untuk client-side (public)
- Row Level Security (RLS) harus diaktifkan di Supabase

## ⚠️ Checklist Keamanan untuk Production

### 1. Supabase RLS (Row Level Security)
```sql
-- Enable RLS pada semua tabel
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Contoh policy untuk orders (sesuaikan dengan kebutuhan)
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = "assignedCsId" OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('Super Admin', 'Admin')
    )
  );
```

### 2. Environment Variables (Production)
Set di DigitalOcean App Platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (optional)

### 3. HTTPS/SSL
- Gunakan SSL certificate (Let's Encrypt)
- Lihat: `SETUP_DOMAIN_SSL_LETSENCRYPT.md`

### 4. Rate Limiting
Aktifkan di Supabase Dashboard → Settings → API

### 5. CORS Configuration
Set di Supabase Dashboard → Settings → API → CORS

## 🚨 JANGAN LAKUKAN INI

❌ Commit `.env.local` ke Git
❌ Share Supabase service_role key di client
❌ Nonaktifkan RLS tanpa policy yang tepat
❌ Hardcode credentials di code

## 📝 Setup Keamanan Lokal

1. Copy environment template:
```powershell
Copy-Item .env.example .env.local
```

2. Edit `.env.local` dengan credentials Anda

3. Restart dev server:
```powershell
npm run dev
```

## 🔐 Supabase Security Checklist

- [ ] RLS enabled pada semua tabel
- [ ] Auth policies configured
- [ ] Email verification enabled
- [ ] JWT expiry configured (default: 1 hour)
- [ ] Database backups enabled
- [ ] API rate limiting enabled
- [ ] Audit logs reviewed regularly

## 📞 Melaporkan Keamanan

Jika menemukan vulnerability, jangan buat public issue.
Hubungi admin secara private.
