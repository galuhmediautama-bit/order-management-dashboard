-- ============================================
-- FIX WEBSITE SETTINGS COLUMNS
-- COPY DAN PASTE SELURUH SCRIPT INI KE SUPABASE SQL EDITOR
-- LALU KLIK "RUN" 
-- ============================================

-- Step 1: Tambahkan semua kolom yang dibutuhkan untuk website settings
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS "siteName" TEXT,
ADD COLUMN IF NOT EXISTS "siteDescription" TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS favicon TEXT,
ADD COLUMN IF NOT EXISTS "supportEmail" TEXT;

-- Step 2: Buat row 'website' jika belum ada
INSERT INTO public.settings (id)
VALUES ('website')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verifikasi kolom sudah ada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'settings'
ORDER BY ordinal_position;

-- Jika berhasil, akan muncul list kolom termasuk:
-- siteName, siteDescription, logo, favicon, supportEmail
