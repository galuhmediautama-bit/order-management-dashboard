# Brand Settings - Troubleshooting Guide

## Error Messages & Solutions

### ❌ "Gagal menyimpan pengaturan: Tabel brand_settings belum dibuat"

**Cause:** Database table `brand_settings` tidak ada di Supabase

**Solution:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy paste SQL dari `BRAND_SETTINGS_SETUP.md`
3. Jalankan query
4. Refresh aplikasi dan coba lagi

---

### ❌ "Gagal menyimpan pengaturan: Tidak ada izin untuk mengakses tabel brand_settings"

**Cause:** RLS (Row Level Security) policy tidak di-set dengan benar

**Solution:**
1. Di Supabase → Table Editor → brand_settings → Policies
2. Pastikan ada policy: "Allow authenticated users to manage brand settings"
3. Jika belum ada, jalankan SQL migration lagi
4. Refresh page dan coba lagi

---

### ❌ "Gagal memuat pengaturan: [error message]"

**Cause:** Masalah saat mengambil data dari database

**Solution:**
1. Buka browser Developer Tools (F12) → Console tab
2. Cari log message yang berisi error detail
3. Screenshot dan cek error code-nya:
   - `PGRST116`: Table not found
   - `PGRST201`: Permission denied
   - `42P01`: Table does not exist

---

### ❌ "Saat submit, modal loading terus"

**Cause:** Request stuck, mungkin timeout atau database error

**Solution:**
1. Buka Developer Tools → Console
2. Cari pesan error yang detail
3. Cek apakah:
   - Table brand_settings ada?
   - User punya permission?
   - Supabase server respond?

---

## Common Issues

### Issue: Form data hilang saat pindah tab
**Status:** ✅ FIXED (v1.1)
- Sekarang form state di-preserve per tab
- User bisa kembali ke form tanpa data hilang

### Issue: QRIS gambar upload gagal
**Solution:**
1. Cek file size < 5MB
2. Format harus image (jpg, png, gif)
3. Check internet connection
4. Lihat console untuk upload error detail

### Issue: Default item tidak ter-set
**Solution:**
- Pastikan hanya satu item punya `isDefault: true`
- Sistem auto-set yang pertama sebagai default
- Klik "Jadikan Utama" untuk ubah default

---

## Debug Steps

### Step 1: Check Table Exists
```sql
-- Di Supabase SQL Editor, jalankan:
SELECT * FROM public.brand_settings LIMIT 1;
```

Jika error "table doesn't exist", jalankan migration SQL.

### Step 2: Check Data Structure
```sql
-- Lihat kolom & tipe data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'brand_settings';
```

Harus ada columns:
- `id` (uuid)
- `brandId` (uuid)
- `bankAccounts` (jsonb)
- `qrisPayments` (jsonb)
- `warehouses` (jsonb)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Step 3: Check RLS Policies
```sql
-- Di Supabase SQL Editor:
SELECT * FROM pg_policies 
WHERE tablename = 'brand_settings';
```

Harus ada minimal satu policy untuk authenticated users.

### Step 4: Check Data Permissions
```sql
-- Test read access
SELECT * FROM brand_settings 
WHERE brandId = 'YOUR_BRAND_ID_HERE';

-- Test write access (upsert)
INSERT INTO brand_settings (brandId, bankAccounts) 
VALUES ('YOUR_BRAND_ID_HERE', '[]'::jsonb)
ON CONFLICT (brandId) DO UPDATE SET updated_at = NOW();
```

---

## Console Debugging

Setiap aksi akan log ke console:

```javascript
// Saat fetch settings
console.log('Loaded brand settings:', data)
console.log('Loaded brand settings:', data) // jika ada error

// Saat save settings
console.log('Saving brand settings payload:', payload)
console.log('Save response:', { data, error })

// Jika error
console.error('Error saving settings:', error)
console.error('Full error:', error)
```

**Cara baca console:**
1. F12 → Console tab
2. Filter by BrandSettingsModal atau brand_settings
3. Cari warning/error messages
4. Screenshot untuk debugging

---

## Performance Tips

### Optimize untuk slow networks:
- Gunakan browser DevTools → Network tab → Throttle to 3G
- Lihat apakah timeout?
- Increase timeout jika perlu

### Monitor database:
- Supabase → Database → Logs
- Lihat slow queries
- Check RLS policy performance

---

## Rollback/Reset Data

### Delete all settings:
```sql
DELETE FROM brand_settings;
```

### Delete specific brand settings:
```sql
DELETE FROM brand_settings 
WHERE brandId = 'uuid-here';
```

### Reset table structure:
```sql
DROP TABLE IF EXISTS brand_settings CASCADE;
-- Then run migration SQL again
```

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Add Bank Account | ✅ Ready | Full validation |
| Add QRIS | ✅ Ready | Image upload support |
| Add Warehouse | ✅ Ready | Full address fields |
| Set Default | ✅ Ready | One per category |
| Edit Items | 🟡 Manual | Remove + Add workflow |
| Delete Items | ✅ Ready | With confirmation |
| Tab Persistence | ✅ Ready | Data tidak hilang saat pindah tab |
| Auto-save | 🟡 Manual | Click "Simpan Pengaturan" button |
| Sync with Products | 🔴 Planned | Next phase |
| Sync with Forms | 🔴 Planned | Next phase |
| Sync with Orders | 🔴 Planned | Next phase |

---

## Contact Support

If still having issues:

1. Collect:
   - Screenshot of error message
   - Console log output (F12 → Console → Copy all)
   - Brand ID yang sedang diedit
   - Waktu/tanggal error terjadi

2. Check:
   - Browser version
   - Internet connection
   - Supabase project status

3. Send to: developer@[your-domain].com
