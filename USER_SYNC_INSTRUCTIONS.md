# 🚨 EMERGENCY USER SYNC - LANGKAH DEMI LANGKAH

## MASALAH
- 6 users di auth.users tapi hanya 1 di public.users
- Manajemen Pengguna tetap menampilkan 1 user

## SOLUSI TERBAIK - Via Browser Console (PALING MUDAH)

### Step 1: Login ke aplikasi
- Buka aplikasi dashboard: `http://localhost:3001` atau URL production
- Login dengan akun Super Admin

### Step 2: Buka Browser Console
- Tekan: `F12` (atau `Ctrl+Shift+I`)
- Pilih tab: **Console**

### Step 3: Copy script dari file ini
- File: `direct_sync_final.js` 
- Copy SEMUA code (dari `async function syncUsersDirectly() {` sampai `syncUsersDirectly();`)

### Step 4: Paste ke Console
- Klik di console input area
- Paste code
- Tekan: `Enter`

### Step 5: Tunggu hasil
Akan muncul logs seperti:
```
🔄 STARTING DIRECT SYNC...

📋 Fetching users from auth.users...
✅ Found 6 users in auth.users: [email1, email2, ...]

🗑️  Deleting all from public.users...
✅ Deleted all users

📝 Inserting users from auth...
✅ Inserted 6 users

✔️  Verifying...

✅ SYNC COMPLETE!

Total users now: 6
Users: [...]

🔄 Reloading page in 2 seconds...
```

Page akan auto-reload setelah 2 detik.

### Step 6: Verify di Manajemen Pengguna
- Setelah reload, buka: **Pengaturan → Manajemen Pengguna**
- Harus melihat 6 users sekarang

---

## JIKA MASIH GAGAL

### Error: "No auth token found"
- ✅ Pastikan SUDAH login
- ✅ Pastikan tidak di incognito mode
- ✅ Refresh page (`Ctrl+F5`) dan coba lagi

### Error: "Failed to fetch auth.users"
- Ini berarti RLS policy memblokir akses
- Solusi: Hubungi Supabase support atau coba workaround di bawah

### Workaround: Manual SQL insert
1. Login ke Supabase Dashboard
2. Project → SQL Editor
3. Paste ini (jika SQL Editor responsif):
```sql
DELETE FROM public.users;
INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
SELECT 
  id,
  email,
  SPLIT_PART(email, '@', 1),
  CASE WHEN email = 'galuhmediautama@gmail.com' THEN 'Super Admin' ELSE 'Advertiser' END,
  'Aktif',
  created_at,
  NOW()
FROM auth.users;
```
4. Run query

---

## EXPECTED RESULT
✅ Total users = 6 (sama dengan auth.users)
✅ Manajemen Pengguna menampilkan 6 users
✅ Semua users punya status 'Aktif'
✅ galuhmediautama@gmail.com = 'Super Admin'
✅ Users lainnya = 'Advertiser'

---

## JIKA TETAP TIDAK BERHASIL
Kemungkinan ada issue di:
1. RLS Policy di public.users table
2. Column mismatch (brand_id vs brandId)
3. Foreign key constraint
4. Auth token expired

Jalankan: `debug_user_sync.sql` di Supabase untuk diagnostics lengkap.
