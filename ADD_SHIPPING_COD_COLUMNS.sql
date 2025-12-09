-- =============================================
-- ADD SHIPPING COST AND COD FEE COLUMNS TO ORDERS TABLE
-- =============================================
-- Run this SQL in Supabase SQL Editor
-- This adds columns for shipping cost and COD fee
-- =============================================

-- Add shippingCost column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "shippingCost" NUMERIC DEFAULT 0;

-- Add codFee column  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "codFee" NUMERIC DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('shippingCost', 'codFee')
ORDER BY column_name;
