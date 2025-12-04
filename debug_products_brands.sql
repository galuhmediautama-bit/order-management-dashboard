-- Debug Script: Check Products and Brands Data
-- Run this in Supabase SQL Editor to verify data

-- 1. Check all brands
SELECT 
    id,
    name,
    status,
    created_at
FROM brands
ORDER BY created_at DESC;

-- 2. Check all products with brand info
SELECT 
    p.id,
    p.name as product_name,
    p.sku,
    p.brand_id,
    b.name as brand_name,
    p.status,
    p.base_price,
    p.category,
    p.created_at
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC;

-- 3. Check products by status
SELECT 
    status,
    COUNT(*) as count
FROM products
GROUP BY status;

-- 4. Check if brand_id matches between products and brands
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.brand_id as product_brand_id,
    b.id as brand_id,
    b.name as brand_name,
    CASE 
        WHEN p.brand_id = b.id THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id;

-- 5. Check column types (important for debugging)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('products', 'brands', 'forms')
    AND column_name IN ('id', 'brand_id', 'product_id')
ORDER BY table_name, column_name;

-- 6. Check forms and their product/brand relationships
SELECT 
    f.id as form_id,
    f.title as form_title,
    f.brand_id as form_brand_id,
    f.product_id as form_product_id,
    b.name as brand_name,
    p.name as product_name,
    p.status as product_status
FROM forms f
LEFT JOIN brands b ON f.brand_id = b.id
LEFT JOIN products p ON f.product_id = p.id
ORDER BY f.created_at DESC
LIMIT 20;

-- 7. Check for orphaned products (products without valid brand)
SELECT 
    p.id,
    p.name,
    p.brand_id,
    p.status,
    CASE 
        WHEN b.id IS NULL THEN 'ORPHANED (No matching brand)'
        ELSE 'OK'
    END as validation_status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id;

-- 8. Detailed product info including variants
SELECT 
    p.id,
    p.name,
    p.brand_id,
    b.name as brand_name,
    p.status,
    p.base_price,
    p.category,
    CASE 
        WHEN p.attributes IS NOT NULL THEN 
            jsonb_array_length(COALESCE(p.attributes->'variants', '[]'::jsonb))
        ELSE 0
    END as variant_count,
    p.created_at
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC;
