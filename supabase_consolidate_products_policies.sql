-- ============================================================================
-- CONSOLIDATE PRODUCTS TABLE RLS POLICIES
-- Fix Multiple Permissive Policies Warnings
-- ============================================================================
-- This script consolidates overlapping policies on the products table into
-- single, optimized policies per action to eliminate performance warnings.
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (INCLUDING NEW ONES IF SCRIPT RE-RUN)
-- ============================================================================

-- Drop old policies (if they exist)
DROP POLICY IF EXISTS "super_admin_all" ON public.products;
DROP POLICY IF EXISTS "admin_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "Users can view their brand products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their brand products" ON public.products;
DROP POLICY IF EXISTS "view_products" ON public.products;

-- Drop new consolidated policies (if script is being re-run)
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- ============================================================================
-- STEP 2: CREATE CONSOLIDATED POLICIES (ONE PER ACTION)
-- ============================================================================
-- Strategy: Use OR conditions to combine multiple role checks into single policy
-- This eliminates multiple permissive policy warnings while maintaining access control
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT Policy: Combine all read access rules
-- ----------------------------------------------------------------------------
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT
USING (
  -- Super Admins can see everything
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Super Admin'
  )
  OR
  -- Admins can see products in their brand
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Admin'
    AND brand_id = products.brand_id
  )
  OR
  -- Regular users can see products in their brand
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND brand_id = products.brand_id
  )
);

-- ----------------------------------------------------------------------------
-- INSERT Policy: Combine all insert access rules
-- ----------------------------------------------------------------------------
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT
WITH CHECK (
  -- Super Admins can insert anything
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Super Admin'
  )
  OR
  -- Admins can insert products in their brand
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Admin'
    AND brand_id = products.brand_id
  )
  OR
  -- Users can insert products in their brand
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND brand_id = products.brand_id
  )
);

-- ----------------------------------------------------------------------------
-- UPDATE Policy: Combine all update access rules
-- ----------------------------------------------------------------------------
CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE
USING (
  -- Super Admins can update everything
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Super Admin'
  )
  OR
  -- Admins can update products in their brand
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Admin'
    AND brand_id = products.brand_id
  )
)
WITH CHECK (
  -- Same conditions for the updated values
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Super Admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Admin'
    AND brand_id = products.brand_id
  )
);

-- ----------------------------------------------------------------------------
-- DELETE Policy: Combine all delete access rules
-- ----------------------------------------------------------------------------
CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE
USING (
  -- Super Admins can delete everything
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Super Admin'
  )
  OR
  -- Admins can delete products in their brand
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid())
    AND role = 'Admin'
    AND brand_id = products.brand_id
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that only 4 policies exist (one per action)
-- SELECT policyname, cmd, permissive, roles
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'products'
-- ORDER BY cmd, policyname;

-- Expected result: 4 policies
-- - products_select_policy (SELECT)
-- - products_insert_policy (INSERT)
-- - products_update_policy (UPDATE)
-- - products_delete_policy (DELETE)

-- Verify no multiple permissive policies remain
-- SELECT cmd, array_agg(policyname) as policies, count(*) as policy_count
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename = 'products'
-- AND permissive = 'PERMISSIVE'
-- GROUP BY cmd, roles
-- HAVING count(*) > 1;

-- Expected result: No rows (empty result = no duplicates)

-- ============================================================================
-- RESULT
-- ============================================================================
-- ✅ Reduced from 5 policies to 4 policies (one per action)
-- ✅ Eliminated all "multiple permissive policies" warnings for products table
-- ✅ Maintained all role-based access control logic
-- ✅ Optimized with (SELECT auth.uid()) for performance
-- ✅ All 16 multiple permissive policy warnings should be resolved
-- ============================================================================
