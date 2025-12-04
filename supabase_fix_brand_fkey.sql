-- Fix Foreign Key: Change products.brand_id from users to brands table
-- Run this in Supabase SQL Editor after ensuring brands table exists

-- Step 1: Drop the old foreign key constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_brand_id_fkey;

-- Step 2: Add new foreign key constraint pointing to brands table
ALTER TABLE products 
ADD CONSTRAINT products_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- Verification query to ensure the constraint is working
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'products' AND constraint_type = 'FOREIGN KEY';

-- Check that all products have valid brand_ids that exist in brands table
SELECT p.id, p.name, p.brand_id, b.name as brand_name 
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE b.id IS NULL;  -- This will show any orphaned products without valid brands
