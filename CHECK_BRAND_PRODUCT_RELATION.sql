-- Check Brand-Product Relationship

-- Query 1: List all brands
SELECT 
  id,
  name,
  created_at
FROM brands
ORDER BY created_at DESC;

-- Query 2: List all products with their brand_id
SELECT 
  p.id,
  p.name,
  p.brand_id,
  p.category,
  p.base_price,
  p.status,
  b.name as brand_name
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC;

-- Query 3: Count products per brand
SELECT 
  b.id,
  b.name,
  COUNT(p.id) as total_products,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id
GROUP BY b.id, b.name
ORDER BY active_products DESC;

-- Query 4: Find orphaned products (brand_id not in brands table)
SELECT 
  id,
  name,
  brand_id,
  status
FROM products
WHERE brand_id NOT IN (SELECT id FROM brands)
OR brand_id IS NULL;

-- Query 5: Check products table schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
