-- SQL Script untuk membuat/update tabel forms dengan semua kolom yang diperlukan
-- Jalankan script ini di Supabase SQL Editor

-- Hapus tabel lama jika ingin membuat ulang (HATI-HATI: akan menghapus semua data!)
-- DROP TABLE IF EXISTS forms CASCADE;

-- Buat tabel forms dengan semua kolom
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    "brandId" TEXT,
    "customDomain" TEXT,
    "mainImage" TEXT NOT NULL DEFAULT '',
    "productImages" TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    "descriptionAlign" TEXT DEFAULT 'left' CHECK ("descriptionAlign" IN ('left', 'center', 'right')),
    "productOptions" JSONB DEFAULT '[]'::jsonb,
    "variantCombinations" JSONB DEFAULT '[]'::jsonb,
    "customerFields" JSONB DEFAULT '{
        "name": {"required": true, "enabled": true},
        "whatsapp": {"required": true, "enabled": true},
        "email": {"required": false, "enabled": true},
        "address": {"required": true, "enabled": true}
    }'::jsonb,
    "shippingSettings" JSONB DEFAULT '{}'::jsonb,
    "paymentSettings" JSONB DEFAULT '{
        "methods": {},
        "bankTransfer": {"enabled": false, "accounts": []},
        "cod": {"enabled": false, "settings": {"fee": 0}},
        "qris": {"enabled": false, "qrImageUrl": ""}
    }'::jsonb,
    "submissionCount" INTEGER DEFAULT 0,
    "createdAt" TEXT DEFAULT '',
    "showTitle" BOOLEAN DEFAULT true,
    "showDescription" BOOLEAN DEFAULT true,
    "thankYouPage" JSONB DEFAULT '{
        "message": "Terima kasih atas pesanan Anda!",
        "showOrderSummary": true,
        "redirectUrl": "",
        "redirectDelay": 0
    }'::jsonb,
    "trackingSettings" JSONB DEFAULT NULL,
    "customScripts" JSONB DEFAULT NULL,
    "customMessageTemplates" JSONB DEFAULT NULL,
    "countdownSettings" JSONB DEFAULT NULL,
    "stockCountdownSettings" JSONB DEFAULT NULL,
    "socialProofSettings" JSONB DEFAULT NULL,
    "ctaSettings" JSONB DEFAULT NULL,
    "commissionPrice" NUMERIC DEFAULT NULL
);

-- Jika tabel sudah ada, tambahkan kolom yang belum ada
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "productImages" TEXT[] DEFAULT '{}';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "brandId" TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "descriptionAlign" TEXT DEFAULT 'left';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "showTitle" BOOLEAN DEFAULT true;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "showDescription" BOOLEAN DEFAULT true;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "trackingSettings" JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "customScripts" JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "customMessageTemplates" JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "countdownSettings" JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "stockCountdownSettings" JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "socialProofSettings" JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "ctaSettings" JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "updatedAt" TEXT DEFAULT '';
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "createdAt" TEXT DEFAULT '';

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_brandId ON forms("brandId");

-- Update constraint untuk descriptionAlign jika belum ada
DO $$ 
BEGIN
    -- Drop existing constraint dengan nama lain jika ada
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'forms_descriptionalign_check'
    ) THEN
        ALTER TABLE forms DROP CONSTRAINT forms_descriptionalign_check;
    END IF;
    
    -- Buat constraint baru
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'forms_descriptionAlign_check'
    ) THEN
        ALTER TABLE forms ADD CONSTRAINT forms_descriptionAlign_check 
        CHECK ("descriptionAlign" IN ('left', 'center', 'right'));
    END IF;
END $$;

-- Verifikasi struktur tabel
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'forms'
ORDER BY ordinal_position;
