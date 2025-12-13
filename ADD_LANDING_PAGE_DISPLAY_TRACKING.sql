-- Add displaySettings and trackingSettings columns to landing_pages table
-- Run this in Supabase SQL Editor

-- Add displaySettings column (for Desktop/Tablet/Mobile visibility)
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "displaySettings" JSONB DEFAULT '{"showOnDesktop": true, "showOnTablet": true, "showOnMobile": true}'::jsonb;

-- Add trackingSettings column (for pixel tracking configuration)
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "trackingSettings" JSONB DEFAULT '{"pageView": [], "buttonClick": []}'::jsonb;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'landing_pages' 
AND column_name IN ('displaySettings', 'trackingSettings');
