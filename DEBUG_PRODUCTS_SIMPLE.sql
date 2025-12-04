-- DEBUG: Simple Products Check (No Placeholders)
-- Run each query one at a time in Supabase SQL Editor

-- ✅ Query 1: Check total products and their status
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive_products
FROM products;

-- ✅ Query 2: List all products (should see results if any exist)
SELECT 
  id,
  name,
  brand_id,
  category,
  base_price,
  status,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 20;

-- ✅ Query 3: List all authenticated users and their roles
SELECT 
  id,
  email,
  role,
  created_at
FROM users
LIMIT 20;

-- ✅ Query 4: Check RLS policies on products table
SELECT 
  policyname,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- ✅ Query 5: Verify products table exists and has correct columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- ✅ Query 6: Simple count - if this shows 0, products table is empty
SELECT COUNT(*) as products_in_db FROM products;
