-- SQL Script untuk menambahkan kolom phone dan address ke tabel users
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tambahkan kolom phone (nomor telepon)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Tambahkan kolom address (alamat)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Tambahkan index untuk phone (optional, untuk performa pencarian)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 4. Verifikasi kolom telah ditambahkan
-- Uncomment baris di bawah untuk melihat struktur tabel
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users';

-- Selesai! Kolom phone dan address sekarang tersedia di tabel users
