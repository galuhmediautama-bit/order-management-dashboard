-- Complete migration for forms table
-- Add all missing columns needed for the form editor

-- Add productId column (FK to products table)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS "productId" UUID;

-- Add assignedAdvertiserId column (FK to users table)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS "assignedAdvertiserId" UUID;

-- Add productVariants column (JSONB array to store product variants)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS "productVariants" JSONB DEFAULT '[]'::jsonb;

-- Add productImages column if not exists (TEXT array for product images)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS "productImages" TEXT[];

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'forms' 
  AND column_name IN ('productId', 'assignedAdvertiserId', 'productVariants', 'productImages')
ORDER BY column_name;
