-- Add pageWidth column to landing_pages table
-- Run this in Supabase SQL Editor

-- Add pageWidth column (for page container width)
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "pageWidth" TEXT DEFAULT '1024px';

-- Verify column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'landing_pages' 
AND column_name = 'pageWidth';
