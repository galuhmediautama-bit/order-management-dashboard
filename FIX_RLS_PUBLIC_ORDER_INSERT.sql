-- ============================================
-- FIX RLS POLICY FOR PUBLIC ORDER INSERT
-- ============================================
-- Problem: Public form cannot insert orders because RLS only allows authenticated users
-- Solution: Add policy to allow anonymous/public insert on orders table
-- 
-- Run this in Supabase SQL Editor
-- ============================================

-- Option 1: Allow ANON role to insert orders (for public forms)
-- This allows unauthenticated users to submit orders via public forms

CREATE POLICY "Public can insert orders via forms" ON orders
  FOR INSERT 
  TO anon
  WITH CHECK (
    -- Only allow if formId is provided (order from public form)
    "formId" IS NOT NULL
  );

-- Option 2: If you also need to allow public SELECT for order confirmation
-- (Usually not needed, but useful for thank you page)
-- CREATE POLICY "Public can view own order by id" ON orders
--   FOR SELECT 
--   TO anon
--   USING (
--     -- Allow viewing only if accessed within 1 hour of creation
--     created_at > NOW() - INTERVAL '1 hour'
--   );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check existing policies on orders table
SELECT 
    policyname,
    roles,
    cmd,
    qual::text as condition,
    with_check::text as with_check_condition
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'orders';

-- ============================================
-- ALTERNATIVE: Disable RLS on orders (NOT RECOMMENDED for production)
-- Only use this for quick testing, then re-enable with proper policies
-- ============================================
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- IF POLICY ALREADY EXISTS, DROP AND RECREATE
-- ============================================
-- DROP POLICY IF EXISTS "Public can insert orders via forms" ON orders;
-- Then run the CREATE POLICY statement above
