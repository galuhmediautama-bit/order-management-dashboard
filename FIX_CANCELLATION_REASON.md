# Fix Pembatalan Pesanan - Gagal Membatalkan

## Masalah
Tombol "Konfirmasi Batalkan" tidak berfungsi, error "Gagal membatalkan pesanan"

## Solusi

### Step 1: Jalankan SQL Migration di Supabase

Buka **Supabase Console** → **SQL Editor** → Copy-paste SQL berikut:

```sql
-- Tambah kolom cancellationReason ke tabel orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT DEFAULT NULL;

-- Verifikasi kolom sudah ada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'cancellationReason';
```

### Step 2: Pastikan Settings Tabel Ada

```sql
-- Verifikasi settings tabel punya cancellation reasons
INSERT INTO settings (id, reasons)
VALUES (
  'cancellationReasons',
  ARRAY[
    'Pelanggan tidak merespons',
    'Pelanggan membatalkan sendiri',
    'Alamat tidak lengkap/salah',
    'Nomor telepon tidak aktif',
    'Produk tidak tersedia',
    'Harga tidak sesuai',
    'Pembayaran gagal',
    'Duplikat pesanan',
    'Lainnya'
  ]::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET reasons = EXCLUDED.reasons;

-- Check hasilnya
SELECT id, reasons FROM settings WHERE id = 'cancellationReasons';
```

### Step 3: Verifikasi RLS Policy

Jika masih error setelah Step 1-2, kemungkinan RLS policy. Jalankan:

```sql
-- Lihat semua policies untuk orders table
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders';
```

Pastikan ada policy yang mengizinkan UPDATE untuk role Anda.

### Step 4: Refresh Dashboard

Setelah menjalankan SQL di atas:
1. Refresh halaman browser (F5)
2. Coba batalkan pesanan lagi
3. Pilih alasan pembatalan
4. Klik "Konfirmasi Batalkan"

## Apa yang sudah diperbaiki di code:

✅ **Better Error Message** - Sekarang error detail akan ditampilkan
✅ **Console Logging** - Error details tercatat di browser console
✅ **Proper Column Quoting** - Menggunakan double quotes untuk column names

## Jika Masih Error:

1. Buka **Browser Console** (F12)
2. Lihat error message yang detail
3. Share error tersebut untuk debugging lebih lanjut

---

**File yang perlu dijalankan:**
- `supabase_add_cancellation_reason.sql` - Migration awal
- `supabase_fix_cancellation_reason.sql` - Fix & verifikasi
