-- ============================================================
-- BRAND-PRODUCT RELATIONSHIP DIAGNOSTIC
-- Copy-paste queries ini satu per satu di Supabase SQL Editor
-- ============================================================

-- ✅ QUERY 1: Cek Semua Brand
-- Gunakan hasil ini untuk copy ID ke Query 2
SELECT 
  id,
  name,
  created_at
FROM brands
ORDER BY created_at DESC;

-- ✅ QUERY 2: Cek Produk per Brand (dengan brand info)
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku,
  p.category,
  p.base_price,
  p.status,
  p.brand_id,
  b.name as brand_name
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC
LIMIT 30;

-- ✅ QUERY 3: Summary - Berapa Produk Aktif per Brand
SELECT 
  b.id as brand_id,
  b.name as brand_name,
  COUNT(p.id) as total_products,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products,
  COUNT(CASE WHEN p.status != 'active' THEN 1 END) as inactive_products
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id
GROUP BY b.id, b.name
ORDER BY active_products DESC;

-- ✅ QUERY 4: Cek Produk dengan Status ≠ 'active' (perlu diupdate)
SELECT 
  id,
  name,
  brand_id,
  status,
  created_at
FROM products
WHERE status != 'active'
ORDER BY created_at DESC;

-- ✅ QUERY 5: Cek Produk Orphaned (brand_id invalid)
SELECT 
  id,
  name,
  brand_id,
  status
FROM products
WHERE brand_id NOT IN (SELECT id FROM brands)
OR brand_id IS NULL;

-- ✅ QUERY 6: Test Filter - Produk Untuk Brand Tertentu
-- GANTI 'COPY_BRAND_ID_FROM_QUERY_1' dengan ID dari Query 1
-- Contoh: WHERE p.brand_id = 'd123e4f5-6a7b-8c9d-ef01-234567890abc'
SELECT 
  p.id,
  p.name,
  p.sku,
  p.category,
  p.status
FROM products p
WHERE p.brand_id = 'COPY_BRAND_ID_FROM_QUERY_1'
AND p.status = 'active'
ORDER BY p.created_at DESC;

-- ============================================================
-- JIKA QUERY 4 MENUNJUKKAN ADA PRODUK NON-ACTIVE, JALANKAN:
-- ============================================================

-- UPDATE semua produk status jadi 'active'
UPDATE products 
SET status = 'active' 
WHERE status != 'active';

-- Verify setelah update
SELECT COUNT(*) as now_active_products FROM products WHERE status = 'active';

-- ============================================================
-- JIKA QUERY 5 MENUNJUKKAN ORPHANED PRODUCTS, JALANKAN:
-- ============================================================

-- OPTIONAL: Hapus produk yang brand_id-nya tidak valid
-- DELETE FROM products WHERE brand_id NOT IN (SELECT id FROM brands) OR brand_id IS NULL;

-- Atau jika ingin update ke brand tertentu (ganti BRAND_ID):
-- UPDATE products SET brand_id = 'BRAND_ID' WHERE brand_id IS NULL;
