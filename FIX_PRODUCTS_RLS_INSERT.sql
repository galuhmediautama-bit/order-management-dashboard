-- ============================================
-- FIX: RLS Policy untuk INSERT Products
-- Problem: User tidak bisa insert produk meski punya permission
-- ============================================

-- 1. Drop existing insert policy jika ada
DROP POLICY IF EXISTS products_insert_policy ON products;
DROP POLICY IF EXISTS products_insert ON products;

-- 2. Buat policy baru yang allow insert untuk role yang punya permission
-- Super Admin, Admin, dan Advertiser bisa insert produk
CREATE POLICY products_insert_policy ON products
    FOR INSERT
    WITH CHECK (
        -- Super Admin bisa insert semua
        auth.jwt() ->> 'role' = 'Super Admin'
        OR
        -- Admin bisa insert semua
        auth.jwt() ->> 'role' = 'Admin'
        OR
        -- Advertiser bisa insert (akan di-filter di aplikasi by brandId)
        auth.jwt() ->> 'role' = 'Advertiser'
    );

-- 3. Verifikasi policy
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
WHERE tablename = 'products'
ORDER BY cmd, policyname;

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan SQL ini di Supabase SQL Editor
-- 2. Klik "Run" untuk eksekusi
-- 3. Verifikasi output menampilkan policy baru
-- 4. Test insert produk dari aplikasi
-- ============================================
