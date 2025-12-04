-- FIX: Products Foreign Key to Brands Table
-- Run this in Supabase SQL Editor

-- Step 1: Check current foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'brand_id';

-- Step 2: Drop old foreign key constraint if exists
-- (Replace 'products_brand_id_fkey' with actual constraint name from Step 1)
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_brand_id_fkey;

-- Step 3: Verify data consistency - check if all brand_ids exist in brands table
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.brand_id,
    b.id as brand_id_check,
    CASE 
        WHEN b.id IS NULL THEN 'MISSING BRAND'
        ELSE 'OK'
    END as status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE b.id IS NULL;

-- Step 4: If there are orphaned products, you need to fix them first
-- Option A: Set to NULL (if your schema allows)
-- UPDATE products SET brand_id = NULL WHERE brand_id NOT IN (SELECT id FROM brands);

-- Option B: Delete orphaned products (CAREFUL!)
-- DELETE FROM products WHERE brand_id NOT IN (SELECT id FROM brands);

-- Option C: Create missing brands (recommended)
-- INSERT INTO brands (id, name, status) 
-- SELECT DISTINCT p.brand_id, 'Unknown Brand', 'active'
-- FROM products p
-- WHERE p.brand_id NOT IN (SELECT id FROM brands);

-- Step 5: Add correct foreign key constraint
ALTER TABLE products
ADD CONSTRAINT products_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES brands(id)
ON DELETE CASCADE;

-- Step 6: Verify the new constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'brand_id';

-- Step 7: Final verification - list all products with brands
SELECT 
    p.id,
    p.name as product_name,
    p.brand_id,
    b.name as brand_name,
    p.status,
    p.created_at
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC;
