# SOLUSI: User Tidak Bisa Tambah Produk

## Problem
User **syahrulwandika@gmail.com** tidak bisa tambah produk

## Root Cause Analysis

### 1. ✅ User TIDAK DITEMUKAN di Database
Query ke database menunjukkan user dengan email `syahrulwandika@gmail.com` tidak ada dalam tabel `users`.

**Kemungkinan:**
- User belum registrasi/belum dibuat oleh Admin
- Email yang digunakan salah/typo
- User terdaftar dengan email berbeda

### 2. ⚠️ RLS Policy Products Table PERLU DIPERBAIKI
Error di screenshot: **"new row violates row-level security policy for table 'products'"**

Ini menunjukkan RLS policy untuk INSERT di tabel `products` terlalu ketat.

## Solusi

### SOLUSI 1: Cari & Verifikasi User yang Benar

**Langkah:**
1. Buka aplikasi sebagai Super Admin
2. Pergi ke **Pengaturan → Manajemen Pengguna**
3. Cari user dengan nama "Syahrul" atau "Wandika"
4. Verifikasi:
   - ✅ Email yang benar
   - ✅ Role = Advertiser (atau Admin)
   - ✅ Status = Aktif
   - ✅ Assigned Brands sudah diset

### SOLUSI 2: Buat User Baru (Jika Belum Ada)

**Langkah:**
1. Login sebagai Super Admin
2. Pergi ke **Pengaturan → Manajemen Pengguna**
3. Klik **Tambah Pengguna**
4. Isi data:
   - Nama: Syahrul Wandika
   - Email: syahrulwandika@gmail.com
   - Role: **Advertiser** (atau Admin)
   - Status: **Aktif**
   - Assigned Brands: Pilih brand yang bisa di-manage
5. Simpan

### SOLUSI 3: Fix RLS Policy Products (WAJIB)

**File:** `FIX_PRODUCTS_RLS_INSERT.sql`

**Eksekusi di Supabase:**
1. Buka Supabase Dashboard
2. Pergi ke **SQL Editor**
3. Copy paste isi file `FIX_PRODUCTS_RLS_INSERT.sql`
4. Klik **Run**
5. Verifikasi output menunjukkan policy baru

**Policy yang dibuat:**
```sql
CREATE POLICY products_insert_policy ON products
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'Super Admin'
        OR auth.jwt() ->> 'role' = 'Admin'
        OR auth.jwt() ->> 'role' = 'Advertiser'
    );
```

## Testing

Setelah fix, test dengan:

1. **Login sebagai user yang bermasalah**
2. **Pergi ke Produk → Tambah Produk**
3. **Isi form produk:**
   - Nama produk: Test Product
   - Brand: (pilih brand yang di-assign)
   - Harga: 220
   - Stok: 999
4. **Klik Semua** (Save)

**Expected:**
- ✅ Produk berhasil disimpan
- ✅ Tidak ada error "row-level security policy"

## Checklist

- [ ] Cek email user yang benar di Manajemen Pengguna
- [ ] Pastikan user punya Role: Advertiser/Admin
- [ ] Pastikan Status: Aktif
- [ ] Pastikan Assigned Brands sudah diset
- [ ] Jalankan SQL fix untuk RLS policy
- [ ] Test tambah produk
- [ ] Verifikasi produk muncul di list

## File Terkait

- `FIX_PRODUCTS_RLS_INSERT.sql` - SQL untuk fix RLS policy
- `test-connection.js` - Script untuk debug user

## Contact

Jika masih error, kirim screenshot:
1. Halaman Manajemen Pengguna (cari Syahrul)
2. Error message lengkap saat tambah produk
3. Browser console error (F12 → Console tab)
