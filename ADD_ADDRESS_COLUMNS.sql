-- =============================================
-- ADD ADDRESS COLUMNS TO ORDERS TABLE
-- =============================================
-- Run this SQL in Supabase SQL Editor
-- This adds separate columns for province, city, district, village, and postalCode
-- =============================================

-- Add province column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS province TEXT;

-- Add city column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city TEXT;

-- Add district column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS district TEXT;

-- Add village column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS village TEXT;

-- Add postalCode column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "postalCode" TEXT;

-- Create indexes for faster filtering/searching
CREATE INDEX IF NOT EXISTS idx_orders_province ON orders (province);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders (city);
CREATE INDEX IF NOT EXISTS idx_orders_district ON orders (district);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('province', 'city', 'district', 'village', 'postalCode')
ORDER BY column_name;
