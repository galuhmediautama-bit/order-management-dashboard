-- SQL Script untuk menambahkan kolom productImages ke tabel forms
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tambahkan kolom productImages (array of text untuk menyimpan URLs gambar)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS productImages TEXT[];

-- 2. Set default value untuk kolom baru (array kosong)
ALTER TABLE forms 
ALTER COLUMN productImages SET DEFAULT '{}';

-- 3. Update existing records yang NULL menjadi array kosong
UPDATE forms 
SET productImages = '{}' 
WHERE productImages IS NULL;

-- 4. Verifikasi kolom telah ditambahkan
-- Uncomment baris di bawah untuk melihat struktur tabel
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'forms' AND column_name = 'productimages';

-- Selesai! Kolom productImages sekarang tersedia di tabel forms
