-- Check if product_id columns exist in orders and forms tables
-- Run this in Supabase SQL editor to verify database readiness

-- Check orders table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'product_id'
ORDER BY ordinal_position;

-- Check forms table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'forms' AND column_name = 'product_id'
ORDER BY ordinal_position;

-- Check all columns in orders table (for reference)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check all columns in forms table (for reference)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'forms'
ORDER BY ordinal_position;

-- Count forms with product_id set
SELECT 
  COUNT(*) as total_forms,
  COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as forms_with_product_id,
  COUNT(CASE WHEN product_id IS NULL THEN 1 END) as forms_without_product_id
FROM forms;

-- Count orders with product_id set
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as orders_with_product_id,
  COUNT(CASE WHEN product_id IS NULL THEN 1 END) as orders_without_product_id
FROM orders;
