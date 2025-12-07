-- Migration: Add product_id columns to orders and forms tables
-- Only run if product_id column doesn't exist

-- Step 1: Add product_id to forms table (if not exists)
ALTER TABLE forms
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Step 2: Add product_id to orders table (if not exists)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_forms_product_id ON forms(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);

-- Step 4: Verify the migration
SELECT 
  'forms' as table_name,
  COUNT(*) as total_rows,
  COUNT(product_id) as rows_with_product_id
FROM forms
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as total_rows,
  COUNT(product_id) as rows_with_product_id
FROM orders;

-- Step 5: Show the updated schema
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE (table_name = 'forms' OR table_name = 'orders') 
  AND column_name = 'product_id'
ORDER BY table_name;
