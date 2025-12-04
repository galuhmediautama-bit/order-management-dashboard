-- ============================================================================
-- SUPABASE RLS PERFORMANCE OPTIMIZATION
-- Fix Database Linter Warnings - December 4, 2025
-- ============================================================================
-- This script addresses two types of performance issues:
-- 1. Auth RLS Initialization Plan warnings (auth.<function>() optimization)
-- 2. Multiple Permissive Policies warnings (policy consolidation)
-- ============================================================================

-- ============================================================================
-- PART 1: FIX AUTH RLS INITIALIZATION PLAN WARNINGS
-- ============================================================================
-- Replace auth.<function>() with (SELECT auth.<function>()) to prevent
-- re-evaluation for each row, improving query performance at scale.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: users (2 policies to fix)
-- ----------------------------------------------------------------------------

-- Fix: Users can read own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
FOR SELECT
USING (id = (SELECT auth.uid()));

-- Fix: Users can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE
USING (id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- TABLE: products (5 policies to fix)
-- ----------------------------------------------------------------------------

-- Fix: super_admin_all
DROP POLICY IF EXISTS "super_admin_all" ON public.products;
CREATE POLICY "super_admin_all" ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Super Admin'
  )
);

-- Fix: admin_manage_own_products
DROP POLICY IF EXISTS "admin_manage_own_products" ON public.products;
CREATE POLICY "admin_manage_own_products" ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role IN ('Admin', 'Super Admin')
    AND brand_id = products.brand_id
  )
);

-- Fix: Users can view their brand products
DROP POLICY IF EXISTS "Users can view their brand products" ON public.products;
CREATE POLICY "Users can view their brand products" ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND brand_id = products.brand_id
  )
);

-- Fix: Users can insert their brand products
DROP POLICY IF EXISTS "Users can insert their brand products" ON public.products;
CREATE POLICY "Users can insert their brand products" ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND brand_id = products.brand_id
  )
);

-- Note: view_products policy will be removed in Part 2 (redundant)

-- ----------------------------------------------------------------------------
-- TABLE: product_form_analytics (1 policy to fix)
-- ----------------------------------------------------------------------------

-- Fix: Authenticated users can view analytics
DROP POLICY IF EXISTS "Authenticated users can view analytics" ON public.product_form_analytics;
CREATE POLICY "Authenticated users can view analytics" ON public.product_form_analytics
FOR SELECT
USING ((SELECT auth.role()) = 'authenticated');

-- ----------------------------------------------------------------------------
-- TABLE: product_audit_log (1 policy to fix)
-- ----------------------------------------------------------------------------

-- Fix: Admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.product_audit_log;
CREATE POLICY "Admins can view audit logs" ON public.product_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role IN ('Super Admin', 'Admin')
  )
);

-- ============================================================================
-- PART 2: FIX MULTIPLE PERMISSIVE POLICIES WARNINGS
-- ============================================================================
-- Consolidate overlapping policies to reduce query overhead.
-- For products table: Use supabase_consolidate_products_policies.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: products - IMPORTANT: Use Separate Consolidation Script
-- ----------------------------------------------------------------------------

-- ⚠️ CRITICAL: The products table has 16 multiple permissive policy warnings
-- These require a complete policy restructure to consolidate overlapping rules.
--
-- SOLUTION: Run the dedicated script: supabase_consolidate_products_policies.sql
--
-- That script will:
-- 1. Drop all 5 existing policies (super_admin_all, admin_manage_own_products, etc.)
-- 2. Create 4 consolidated policies (one per action: SELECT, INSERT, UPDATE, DELETE)
-- 3. Use OR conditions to combine role checks into single policies
-- 4. Eliminate all 16 "multiple permissive policies" warnings
--
-- DO NOT apply the policies below - they are kept for reference only:

/*
-- OLD POLICIES (DO NOT USE - causes multiple permissive policy warnings):
DROP POLICY IF EXISTS "super_admin_all" ON public.products;
DROP POLICY IF EXISTS "admin_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "Users can view their brand products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their brand products" ON public.products;
DROP POLICY IF EXISTS "view_products" ON public.products;

-- These will be replaced by consolidated policies in supabase_consolidate_products_policies.sql
*/

-- ----------------------------------------------------------------------------
-- TABLE: users - Consolidate duplicate policies
-- ----------------------------------------------------------------------------

-- Remove redundant "allow_all" policies
DROP POLICY IF EXISTS "users_allow_all_insert" ON public.users;
DROP POLICY IF EXISTS "users_allow_all_select" ON public.users;
DROP POLICY IF EXISTS "users_allow_all_update" ON public.users;

-- Ensure the INSERT policy exists for user registration
DROP POLICY IF EXISTS "Users can insert with signup" ON public.users;
CREATE POLICY "Users can insert with signup" ON public.users
FOR INSERT
WITH CHECK (true); -- Allow signup, validation handled by application

-- Remaining policies:
-- ✓ Users can read own profile (optimized SELECT)
-- ✓ Users can update own profile (optimized UPDATE)
-- ✓ Users can insert with signup (INSERT for registration)

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the fixes:
-- ============================================================================

-- Check all policies and their definitions
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'products', 'product_form_analytics', 'product_audit_log')
-- ORDER BY tablename, policyname;

-- Check for remaining multiple permissive policies
-- SELECT tablename, cmd, array_agg(policyname) as policies, count(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND permissive = 'PERMISSIVE'
-- GROUP BY tablename, cmd, roles
-- HAVING count(*) > 1
-- ORDER BY tablename, cmd;

-- Check for auth.uid() calls (should find none without SELECT wrapper)
-- SELECT tablename, policyname, qual
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.role()%')
-- AND qual NOT LIKE '%(SELECT auth.%';

-- ============================================================================
-- EXPECTED RESULTS AFTER APPLYING BOTH SCRIPTS
-- ============================================================================
-- Execute in this order:
-- 1. Run this script (supabase_fix_rls_performance.sql)
-- 2. Run supabase_consolidate_products_policies.sql
--
-- Results:
-- ✅ All auth.<function>() calls wrapped with (SELECT ...) for performance
-- ✅ Redundant policies removed on users table
-- ✅ Products table policies consolidated (one per action)
-- ✅ All 8 "Auth RLS Initialization Plan" warnings resolved
-- ✅ All 16 "Multiple Permissive Policies" warnings for products resolved
-- ✅ Users table policy duplication warnings resolved
-- ✅ Query performance improved at scale
-- ============================================================================

-- ============================================================================
-- IMPLEMENTATION NOTES
-- ============================================================================
-- 1. Both scripts are safe to run multiple times (use DROP IF EXISTS)
-- 2. Policies recreated with consistent naming, no app code changes needed
-- 3. Test in development/staging before applying to production
-- 4. Run verification queries after applying to confirm success
-- 5. Monitor query performance before/after to measure improvement
-- 
-- EXECUTION ORDER:
-- Step 1: Copy and run this entire script in Supabase SQL Editor
-- Step 2: Copy and run supabase_consolidate_products_policies.sql
-- Step 3: Run verification queries (commented below)
-- Step 4: Check Supabase Database Linter again (should show significant improvement)
-- ============================================================================
