# 🔒 PANDUAN KEAMANAN - Order Management Dashboard

## ⚠️ MASALAH KEAMANAN KRITIS YANG SUDAH DIPERBAIKI

### 1. ✅ Hardcoded Credentials (FIXED)
**Masalah**: Supabase credentials di-hardcode di `firebase.ts`
**Solusi**: 
- Credentials sekarang menggunakan environment variables
- Fallback ke hardcoded hanya untuk development
- File `.env.local.example` dibuat sebagai template

**Action Required**:
```powershell
# Buat file .env.local dan isi dengan credentials
Copy-Item .env.local.example .env.local
# Edit .env.local dengan credentials sebenarnya
```

### 2. ✅ Sensitive Data Logging (FIXED)
**Masalah**: `console.log()` mengekspos data order dan user
**Solusi**: 
- Dihapus dari `SettingsPage.tsx` 
- Dihapus dari `FormViewerPage.tsx`
- Hanya error messages yang di-log (tanpa data sensitif)

### 3. ✅ .gitignore Configuration (VERIFIED)
**Status**: ✅ Sudah benar
- `.env` dan `.env.local` sudah ada di .gitignore
- Credentials tidak akan ter-commit ke Git

---

## 🛡️ KEAMANAN YANG PERLU DITAMBAHKAN

### 1. Row Level Security (RLS) - Supabase
**Priority**: 🔴 CRITICAL

Aktifkan RLS untuk semua tabel di Supabase SQL Editor:

```sql
-- Enable RLS untuk tabel orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa lihat order brand mereka
CREATE POLICY "Users can view their brand orders" ON orders
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      -- Super Admin/Admin bisa lihat semua
      role IN ('Super Admin', 'Admin', 'Keuangan')
      -- Advertiser hanya lihat order dari brand mereka
      OR (role = 'Advertiser' AND "brandId" = ANY("assignedBrandIds"))
      -- CS hanya lihat order yang di-assign ke mereka
      OR (role = 'Customer service' AND "assignedCsId" = id)
    )
  )
);

-- Policy: User hanya bisa update order yang relevan
CREATE POLICY "Users can update relevant orders" ON orders
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Admin', 'Customer service')
  )
);

-- Enable RLS untuk tabel users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa lihat user lain sesuai role
CREATE POLICY "Users can view based on role" ON users
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Admin', 'Keuangan')
  )
  OR id = auth.uid() -- User bisa lihat profil sendiri
);

-- Policy: Hanya Admin yang bisa update users
CREATE POLICY "Only admins can update users" ON users
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Admin')
  )
);

-- Enable RLS untuk tabel forms
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Policy: Form bisa diakses publik untuk view
CREATE POLICY "Forms are publicly viewable" ON forms
FOR SELECT USING (true);

-- Policy: Hanya admin/advertiser yang bisa edit form brand mereka
CREATE POLICY "Users can edit their brand forms" ON forms
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      role IN ('Super Admin', 'Admin')
      OR (role = 'Advertiser' AND "brandId" = ANY("assignedBrandIds"))
    )
  )
);

-- Enable RLS untuk tabel abandoned_carts
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Policy: Sesuai brand access
CREATE POLICY "Users can view their brand carts" ON abandoned_carts
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      role IN ('Super Admin', 'Admin', 'Customer service')
      OR (role = 'Advertiser' AND "brandId" = ANY("assignedBrandIds"))
    )
  )
);
```

### 2. Input Sanitization
**Priority**: 🟡 HIGH

Tambahkan validasi input di client-side:

```typescript
// utils.ts - Tambahkan fungsi sanitasi
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
```

### 3. Rate Limiting
**Priority**: 🟡 HIGH

Implementasi di Supabase atau gunakan Cloudflare:

```typescript
// Tambahkan di FormViewerPage untuk mencegah spam order
const RATE_LIMIT_KEY = 'orderSubmitTimestamp';
const RATE_LIMIT_DURATION = 60000; // 1 menit

const checkRateLimit = (): boolean => {
  const lastSubmit = localStorage.getItem(RATE_LIMIT_KEY);
  if (lastSubmit) {
    const timeSince = Date.now() - parseInt(lastSubmit);
    if (timeSince < RATE_LIMIT_DURATION) {
      return false;
    }
  }
  return true;
};

// Di handleSubmit:
if (!checkRateLimit()) {
  setSubmissionError('Mohon tunggu sebelum mengirim pesanan lagi.');
  return;
}
localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
```

### 4. HTTPS Only
**Priority**: 🔴 CRITICAL

Pastikan di production:
- Domain menggunakan HTTPS (sudah ada di SETUP_DOMAIN_SSL.md)
- Tambahkan HSTS header di nginx:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 5. Content Security Policy (CSP)
**Priority**: 🟢 MEDIUM

Tambahkan di `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://ggxyaautsdukyapstlgr.supabase.co https://www.facebook.com;">
```

### 6. Session Management
**Priority**: 🟡 HIGH

Supabase sudah menangani ini, tapi pastikan:
- Session timeout dikonfigurasi (default 1 hour)
- Refresh token rotation enabled
- Logout menghapus semua session storage

### 7. API Key Rotation
**Priority**: 🟢 MEDIUM

**Action Required**:
1. Ganti Supabase anon key secara berkala (setiap 3-6 bulan)
2. Gunakan service_role key hanya untuk backend operations
3. Jangan expose service_role key di frontend

---

## 🎯 CHECKLIST KEAMANAN DEPLOYMENT

### Sebelum Deploy ke Production:
- [ ] Ganti semua hardcoded credentials dengan env vars
- [ ] Aktifkan RLS untuk semua tabel Supabase
- [ ] Setup HTTPS dengan Let's Encrypt
- [ ] Tambahkan CSP headers
- [ ] Test authentication flow
- [ ] Verifikasi role-based access control
- [ ] Setup monitoring & logging (tanpa ekspos data sensitif)
- [ ] Backup database secara berkala
- [ ] Setup alert untuk suspicious activities

### Maintenance Rutin:
- [ ] Review access logs bulanan
- [ ] Update dependencies (npm audit fix)
- [ ] Rotate API keys setiap 6 bulan
- [ ] Review & update RLS policies
- [ ] Test disaster recovery plan

---

## 📞 JIKA TERJADI SECURITY BREACH

1. **Immediate Actions**:
   - Rotate semua API keys & credentials
   - Review access logs
   - Notify affected users
   - Reset passwords untuk users yang terpengaruh

2. **Investigation**:
   - Identifikasi titik masuk breach
   - Check data yang terekspos
   - Document incident timeline

3. **Prevention**:
   - Patch vulnerability
   - Update security policies
   - Implement additional monitoring

---

## 🔗 Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Let's Encrypt Setup](./SETUP_DOMAIN_SSL_LETSENCRYPT.md)

---

**Last Updated**: December 4, 2025
**Security Level**: 🟡 MEDIUM (needs RLS implementation)
