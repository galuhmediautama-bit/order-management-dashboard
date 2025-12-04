# Fix Summary: User Registration Role Bug

## Issue
Ketika user baru register dengan role "Customer service" atau "Advertiser", mereka masuk dengan role "Super Admin".

## Root Cause
Ada 3 masalah yang bersama-sama menyebabkan bug ini:

### 1. Race Condition (Primary Issue)
- Ketika user register, 2 hal terjadi:
  1. User dibuat di `auth.users`
  2. User profile dibuat di `public.users` dengan role yang dipilih
- **Masalah**: User bisa login sebelum profile selesai disimpan
- **Akibat**: Sidebar query user profile gagal, return null

### 2. Tidak Ada Retry Logic
- Ketika query pertama gagal, langsung default ke "Super Admin"
- Seharusnya retry beberapa kali untuk menunggu profile selesai di-insert

### 3. Unsafe Fallback Default
- Function `getNormalizedRole` default ke "Super Admin" ketika role adalah undefined
- **Ini sangat bahaya** karena bisa elevate privilege

## Fixes Applied

### Fix #1: Add Retry Logic (Sidebar.tsx)
```typescript
// Retry hingga 3 kali dengan exponential backoff (500ms, 1000ms, 1500ms)
while (retries < maxRetries && !userDoc) {
    const result = await supabase.from('users').select('*').eq('id', user.id).single();
    userDoc = result.data;
    if (!userDoc && retries < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retries + 1)));
        retries++;
    }
}
```

### Fix #2: Change Fallback from Super Admin to Admin (utils.ts)
```typescript
// Jangan default ke Super Admin, bahaya!
if (!role) {
    console.warn('⚠️ getNormalizedRole called with undefined role');
    return 'Admin'; // ✅ Lebih aman
}
```

### Fix #3: Restrict Access During Loading (Sidebar.tsx)
```typescript
if (!currentUserRole) {
    // Saat profile masih loading, hanya tampilkan halaman dasar
    return item.name === 'Dasbor' || item.name === 'Profil Saya' || item.name === 'Pengaturan Akun';
}
```

### Fix #4: Better Logging (LoginPage.tsx)
```typescript
console.log('✅ User profile created successfully:', { 
    userId: authData.user.id, 
    email: email, 
    role: selectedRole  // Log role yang disimpan
});
```

## Files Changed
1. ✅ `components/Sidebar.tsx` - Add retry logic
2. ✅ `utils.ts` - Change unsafe fallback
3. ✅ `pages/LoginPage.tsx` - Better logging
4. ✅ `supabase_fix_user_registration_role.sql` - Database fixes (RLS policies)
5. ✅ `FIX_USER_REGISTRATION_ROLE.md` - Testing guide

## Testing Steps

### Step 1: Deploy Code Changes
- Semua code changes sudah dilakukan ✅

### Step 2: Run SQL Script
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi `supabase_fix_user_registration_role.sql`
3. Click "Run"
4. Verify tidak ada error

### Step 3: Test User Registration
1. Buka app di browser
2. Klik "Daftar di sini"
3. Isi form:
   - Nama: "Test User"
   - **Peran: Pilih "👥 Customer Service"** (penting!)
   - WhatsApp: 08123456789
   - Alamat: Jalan Test
   - Email: `test_cs_@example.com`
   - Password: `Test123!`
4. Klik "Daftar Sekarang"
5. Cek success message - harus bilang "...dengan role: Customer service"

### Step 4: Verify di Database
1. Supabase → SQL Editor
2. Run query:
```sql
SELECT id, email, role, status FROM public.users 
WHERE email = 'test_cs_@example.com';
```
3. Verify role = `"Customer service"` bukan `"Super Admin"`

### Step 5: Approve User
1. Supabase SQL Editor, run:
```sql
UPDATE public.users 
SET status = 'Aktif' 
WHERE email = 'test_cs_@example.com';
```

### Step 6: Login dan Cek Console
1. Login dengan akun test
2. Buka DevTools (F12 → Console)
3. Cari log:
   ```
   ✅ Sidebar - User role from DB: Customer service → Normalized: Customer service
   ```
   - Ini artinya BERHASIL ✅
   
   Atau cari error:
   ```
   ⚠️ User profile not found in DB after retries
   ```
   - Ini artinya profile tidak tersimpan ❌

### Step 7: Cek Navigation
- Sidebar hanya tampilkan:
  - ✅ Dasbor
  - ❌ Pengaturan (hidden untuk CS)
  - Jika Advertiser:
    - ✅ Laporan Iklan
    - ✅ Penghasilan

## Troubleshooting

### Problem: Role masih Super Admin
**Cek:**
1. Browser console (F12) ada error apa?
2. Database - apakah profile tersimpan dengan role yang benar?
```sql
SELECT * FROM public.users WHERE email = 'test_email@example.com';
```

**Solution:**
- Jika role di database benar tapi app masih salah → restart browser
- Jika role di database salah/null → manual fix:
```sql
UPDATE public.users SET role = 'Customer service' 
WHERE email = 'test_email@example.com';
```

### Problem: User tidak bisa login
- Cek status = 'Aktif'?
```sql
UPDATE public.users SET status = 'Aktif' 
WHERE email = 'test_email@example.com';
```

### Problem: RLS error
- Jalankan `supabase_fix_user_registration_role.sql` yang menambah RLS policies

## Expected Behavior

| Sebelum Fix | Sesudah Fix |
|-----------|-----------|
| Register CS → Jadi Super Admin | Register CS → Tetap CS ✅ |
| Sidebar langsung set role | Sidebar retry 3x sebelum set role ✅ |
| Default fallback: Super Admin | Default fallback: Admin (aman) ✅ |
| Logging tidak jelas | Console log jelas saat ada issue ✅ |

## Monitoring

Untuk monitoring jika masih ada user dengan role salah, bisa run query ini di Supabase:

```sql
-- Cari user yang mungkin punya masalah role
SELECT 
  u.id,
  u.email,
  u.role,
  u.status,
  au.created_at,
  (now() - au.created_at) as age
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'Super Admin'
  AND u.status = 'Tidak Aktif'
  AND (now() - au.created_at) < '1 day'
ORDER BY au.created_at DESC;
```

Jika ada user dengan kondisi di atas, itu kemungkinan user baru yang belum diapprove, mereka legitimate bisa di-approve.

## Next Steps
1. ✅ Code changes done
2. ⏳ Run SQL script di Supabase
3. ⏳ Test dengan user baru
4. ⏳ Monitor console logs
5. ⏳ Approve test user
6. ⏳ Verify role correct

---

**Kontakt jika ada issues!**
