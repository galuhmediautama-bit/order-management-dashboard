# 🔧 Troubleshooting: Update Pengguna Gagal

## Masalah Umum & Solusi

### 1. **"Gagal menyimpan pengguna" - Error Code 42703**
**Penyebab:** Kolom yang tidak ada di tabel database

**Solusi:**
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan query berikut untuk memeriksa struktur tabel:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

3. Tambahkan kolom yang hilang (jika diperlukan):
```sql
-- Tambah kolom assignedBrandIds
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "assignedBrandIds" text[] DEFAULT '{}';

-- Tambah kolom baseSalary
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "baseSalary" integer DEFAULT 0;

-- Tambah kolom avatar
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar text;
```

---

### 2. **"Gagal menyimpan pengguna" - Error Code 23505**
**Penyebab:** Email sudah digunakan oleh pengguna lain (unique constraint violation)

**Solusi:**
- Email harus unik di sistem
- Gunakan email yang berbeda
- Atau hapus user lama dengan email yang sama terlebih dahulu

---

### 3. **"Gagal menyimpan pengguna" - Error Code 42501**
**Penyebab:** Permission denied (RLS Policy issue)

**Solusi:**
1. Buka Supabase Dashboard → Authentication → Policies
2. Pastikan policy untuk tabel `users` memperbolehkan UPDATE:

```sql
-- Policy untuk UPDATE users
CREATE POLICY "Allow authenticated users to update users"
ON public.users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Atau untuk Super Admin only:
CREATE POLICY "Allow Super Admin to update users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Super Admin'
  )
)
WITH CHECK (true);
```

---

### 4. **"Gagal menyimpan pengguna" - Error Code 42P01**
**Penyebab:** Tabel `users` belum dibuat di database

**Solusi:**
Jalankan SQL untuk membuat tabel:

```sql
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    address text,
    role text NOT NULL DEFAULT 'Customer service',
    status text NOT NULL DEFAULT 'Tidak Aktif',
    "lastLogin" timestamptz DEFAULT now(),
    avatar text,
    "baseSalary" integer DEFAULT 0,
    "assignedBrandIds" text[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all users"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super Admin can update users"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Super Admin'
  )
)
WITH CHECK (true);

CREATE POLICY "Super Admin can insert users"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Super Admin'
  )
);

CREATE POLICY "Super Admin can delete users"
ON public.users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Super Admin'
  )
);
```

---

### 5. **Console Error Logs**

Jika masih gagal, cek Console Browser (F12):
1. Buka DevTools (F12)
2. Tab Console
3. Cari error dengan prefix: "Update error:" atau "Error saving user:"
4. Copy error message lengkap

**Error Codes yang Sering Muncul:**
- `42P01`: Table tidak ada
- `42703`: Column tidak ada
- `23505`: Unique constraint violation (email duplikat)
- `42501`: Permission denied (RLS issue)
- `23503`: Foreign key violation
- `22P02`: Invalid input syntax (data type mismatch)

---

## Perbaikan yang Sudah Dilakukan

### Update Function `handleSaveUser` ✅

**Sebelum:**
```typescript
// Mengirim semua field userData (bisa ada field yang tidak ada di DB)
const { error } = await supabase.from('users').update(userData).eq('id', userData.id);
```

**Sesudah:**
```typescript
// Hanya kirim field yang valid dan ada di database
const updateData: any = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    status: userData.status,
    phone: userData.phone || null,
    address: userData.address || null,
    assignedBrandIds: userData.assignedBrandIds || []
};

// Remove undefined values
Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
        delete updateData[key];
    }
});

const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userData.id);
```

**Improvements:**
1. ✅ Hanya kirim field yang diperlukan
2. ✅ Handle null values dengan benar
3. ✅ Tidak kirim `lastLogin` saat update (hindari timestamp conflict)
4. ✅ Remove undefined values
5. ✅ Better error messages dengan error codes
6. ✅ Console logging untuk debugging

---

## Cara Test Fix

1. **Buka halaman Pengaturan → Manajemen Pengguna**
2. **Klik Edit pada user mana saja**
3. **Ubah data (misalnya nama atau role)**
4. **Klik Simpan**

### Expected Result:
- ✅ Toast notification: "Pengguna berhasil diperbarui."
- ✅ Tabel user ter-refresh dengan data baru
- ✅ Tidak ada error di console

### If Still Failing:
1. Buka Console (F12)
2. Cari error message: "Update error:"
3. Copy full error dan error code
4. Match dengan troubleshooting guide di atas

---

## Additional Debugging

Jika masih gagal setelah semua fix:

```javascript
// Tambahkan di console browser untuk test manual:
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1);

console.log('Users table structure:', data);
console.log('Error (if any):', error);
```

Atau test update secara manual:
```javascript
const testUpdate = await supabase
  .from('users')
  .update({ name: 'Test Name' })
  .eq('email', 'your@email.com')
  .select();

console.log('Update result:', testUpdate);
```

---

## Summary

**Masalah utama:** Update gagal karena mengirim field yang tidak ada di database atau format data yang salah

**Solusi:** 
- ✅ Filter data sebelum dikirim ke database
- ✅ Handle error dengan error codes yang jelas
- ✅ Better logging untuk debugging
- ✅ Remove undefined/invalid values

**Status:** FIXED ✅
