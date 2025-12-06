# Brand Settings Setup Guide

## Langkah 1: Jalankan SQL Migration

Jika Anda melihat error **"Gagal menyimpan pengaturan: Tabel brand_settings belum dibuat"**, ikuti langkah berikut:

### Di Supabase Dashboard:

1. Buka **Supabase Project** Anda
2. Navigasi ke **SQL Editor**
3. Klik **New Query**
4. Copy & paste SQL di bawah ini:

```sql
-- Create brand_settings table
CREATE TABLE IF NOT EXISTS public.brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brandId UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
    bankAccounts JSONB DEFAULT '[]'::jsonb,
    qrisPayments JSONB DEFAULT '[]'::jsonb,
    warehouses JSONB DEFAULT '[]'::jsonb,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brand_settings_brandId ON public.brand_settings(brandId);

-- Enable RLS (Row Level Security)
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage brand settings
CREATE POLICY "Allow authenticated users to manage brand settings"
    ON public.brand_settings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE public.brand_settings IS 'Stores default settings (bank accounts, QRIS, warehouses) for each brand';
COMMENT ON COLUMN public.brand_settings.bankAccounts IS 'Array of BankAccount objects';
COMMENT ON COLUMN public.brand_settings.qrisPayments IS 'Array of QRISData objects';
COMMENT ON COLUMN public.brand_settings.warehouses IS 'Array of Warehouse objects';
```

5. Klik **Run** (Ctrl + Enter)
6. Tunggu sampai berhasil

## Langkah 2: Verifikasi

Setelah query berhasil:

1. Buka **Table Editor** di Supabase
2. Cari tabel **brand_settings** di list
3. Harus ada empty table dengan columns: `id`, `brandId`, `bankAccounts`, `qrisPayments`, `warehouses`, `createdAt`, `updatedAt`

## Langkah 3: Coba Lagi

Kembali ke aplikasi dan coba buka Brand Settings lagi:

1. Buka halaman **Brands**
2. Klik tombol ⚙️ (Settings) di salah satu brand
3. Tambahkan data (misal: bank account)
4. Klik **Simpan Pengaturan**

## Troubleshooting

### Error: "Tidak ada izin untuk mengakses tabel brand_settings"
- Pastikan RLS policy sudah di-enable dengan query di atas
- Refresh halaman browser
- Clear cache (Ctrl + Shift + Delete)

### Error: "Tabel brand_settings tidak ditemukan"
- Pastikan SQL query sudah dijalankan sampai selesai
- Cek di Supabase Table Editor untuk melihat tabel baru

### Masih error setelah SQL dijalankan?
- Buka **Developer Console** (F12)
- Cari tab **Console**
- Screenshot error message yang muncul
- Kirim ke developer

## Auto-Initialization

Aplikasi sudah memiliki helper yang akan:

1. **Otomatis detect** jika tabel tidak ada
2. **Membuat settings record** pertama kali user save
3. **Show error message** yang helpful jika terjadi masalah

Jadi user tidak perlu manual create - sistem akan auto-handle!

## Untuk Developer

Jika perlu reset settings untuk testing:

```sql
-- Delete all brand settings
DELETE FROM public.brand_settings;

-- Or delete settings untuk brand tertentu
DELETE FROM public.brand_settings WHERE brandId = '<uuid_brand>';
```

---

**Note:** Setelah table dibuat, aplikasi akan berjalan normal tanpa perlu konfigurasi tambahan.
