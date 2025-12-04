-- Fix RLS Performance Issues on settings table
-- Supabase Database Linter Fixes
-- Issue: Multiple permissive policies per role/action causing performance degradation
-- Solution: Consolidate duplicate policies and optimize auth.uid() calls

-- Step 1: Drop ALL old duplicate policies
-- These policies are creating duplicate evaluations for each role/action combination
DROP POLICY IF EXISTS "Admin and Super Admin can update settings" ON settings;
DROP POLICY IF EXISTS "Admin and Super Admin can insert settings" ON settings;
DROP POLICY IF EXISTS "Admin and Super Admin can delete settings" ON settings;
DROP POLICY IF EXISTS "settings_allow_all_access" ON settings;

-- Step 2: Create consolidated, optimized policies
-- Single policy per action using (select auth.uid()) for performance
-- This prevents Supabase from re-evaluating auth.uid() for each row

-- UPDATE policy: Only Super Admin and Admin can update
CREATE POLICY "Authenticated users can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (select auth.uid())
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- INSERT policy: Only Super Admin and Admin can insert
CREATE POLICY "Authenticated users can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (select auth.uid())
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- DELETE policy: Only Super Admin and Admin can delete
CREATE POLICY "Authenticated users can delete settings" ON settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = (select auth.uid())
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- SELECT policy: All authenticated users can read settings (used globally)
CREATE POLICY "Authenticated users can select settings" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- VERIFICATION: Check that duplicate policies are gone
-- Expected: 4 policies total (1 UPDATE, 1 INSERT, 1 DELETE, 1 SELECT)
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'settings' 
ORDER BY policyname;

-- Count policies to ensure consolidation worked
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'settings';
