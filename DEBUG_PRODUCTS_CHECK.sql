-- DEBUG: Check Products in Database
-- Run this in Supabase SQL Editor to verify products exist

-- 1. Check total products
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive_products
FROM products;

-- 2. List all products with their details
SELECT 
  id,
  name,
  brand_id,
  sku,
  category,
  base_price,
  status,
  created_at
FROM products
ORDER BY created_at DESC;

-- 3. Check if logged-in user matches any brand_id
-- Replace 'YOUR_USER_ID' with actual user ID from auth.users
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(p.id) as products_count
FROM users u
LEFT JOIN products p ON u.id = p.brand_id AND p.status = 'active'
WHERE u.id = 'YOUR_USER_ID'
GROUP BY u.id, u.email, u.role;

-- 4. List products for specific brand (replace with actual user id)
SELECT 
  id,
  name,
  sku,
  category,
  base_price,
  status
FROM products
WHERE brand_id = 'YOUR_USER_ID'
AND status = 'active'
ORDER BY created_at DESC;

-- 5. Check RLS policies on products table
SELECT 
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- 6. Verify products table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
