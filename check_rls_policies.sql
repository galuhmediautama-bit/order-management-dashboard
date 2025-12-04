-- Check RLS Policies on Products Table
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on products table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'products';

-- 2. List all RLS policies on products table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'products';

-- 3. Check if there's a SELECT policy that might block access
SELECT 
    policyname,
    cmd,
    qual::text as condition
FROM pg_policies
WHERE tablename = 'products'
    AND cmd = 'SELECT';

-- 4. Test direct query (this should work if you have access)
SELECT 
    id,
    name,
    brand_id,
    status,
    created_at
FROM products
LIMIT 10;

-- 5. Check brands table RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'brands';

-- 6. List all RLS policies on brands table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'brands';

-- 7. Test join query between products and brands
SELECT 
    p.id,
    p.name as product_name,
    p.brand_id,
    b.name as brand_name,
    p.status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LIMIT 10;

-- 8. Count products per brand
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    COUNT(p.id) as product_count
FROM brands b
LEFT JOIN products p ON p.brand_id = b.id
GROUP BY b.id, b.name
ORDER BY product_count DESC;

-- If RLS is blocking, you might need to add policies like:
-- 
-- -- Allow authenticated users to view all products
-- CREATE POLICY "view_products" ON products
--     FOR SELECT
--     TO authenticated
--     USING (true);
-- 
-- -- Allow authenticated users to view all brands
-- CREATE POLICY "view_brands" ON brands
--     FOR SELECT
--     TO authenticated
--     USING (true);
