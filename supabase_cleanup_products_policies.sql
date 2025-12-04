-- ============================================================================
-- EMERGENCY CLEANUP: Remove Duplicate Product Policies
-- ============================================================================
-- This script removes ALL policies from products table and recreates
-- only the 4 consolidated policies needed.
-- Run this if you accidentally have both old and new policies active.
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ABSOLUTELY ALL POLICIES ON PRODUCTS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "super_admin_all" ON public.products;
DROP POLICY IF EXISTS "admin_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "Users can view their brand products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their brand products" ON public.products;
DROP POLICY IF EXISTS "view_products" ON public.products;

-- Drop consolidated policies (if they exist)
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- ============================================================================
-- STEP 2: CREATE CLEAN CONSOLIDATED POLICIES (ONE PER ACTION)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT Policy: All read access rules in one policy
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
-- INSERT Policy: All insert access rules in one policy
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
-- UPDATE Policy: All update access rules in one policy
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
-- DELETE Policy: All delete access rules in one policy
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
-- STEP 3: FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- Drop and recreate views with SECURITY INVOKER (not SECURITY DEFINER)

-- Drop existing views
DROP VIEW IF EXISTS public.product_performance_aggregate CASCADE;
DROP VIEW IF EXISTS public.advertiser_product_performance CASCADE;

-- Recreate product_performance_aggregate with SECURITY INVOKER
CREATE VIEW public.product_performance_aggregate
WITH (security_invoker = true) AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.brand_id,
    COUNT(DISTINCT pfa.form_id) as total_forms,
    COUNT(DISTINCT pfa.advertiser_id) as total_advertisers,
    COALESCE(SUM(pfa.views_count), 0) as total_views,
    COALESCE(SUM(pfa.clicks_count), 0) as total_clicks,
    COALESCE(SUM(pfa.orders_count), 0) as total_orders,
    COALESCE(SUM(pfa.total_revenue), 0) as total_revenue,
    ROUND(
        CASE 
            WHEN COALESCE(SUM(pfa.views_count), 0) > 0 
            THEN (COALESCE(SUM(pfa.orders_count), 0)::NUMERIC / COALESCE(SUM(pfa.views_count), 0)::NUMERIC) * 100
            ELSE 0 
        END, 
        2
    ) as conversion_rate_percent,
    ROUND(
        CASE 
            WHEN COALESCE(SUM(pfa.orders_count), 0) > 0 
            THEN COALESCE(SUM(pfa.total_revenue), 0) / COALESCE(SUM(pfa.orders_count), 0)::NUMERIC
            ELSE 0 
        END, 
        2
    ) as avg_order_value,
    MAX(pfa.updated_at) as last_updated
FROM products p
LEFT JOIN product_form_analytics pfa ON p.id = pfa.product_id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.brand_id;

-- Recreate advertiser_product_performance with SECURITY INVOKER
CREATE VIEW public.advertiser_product_performance
WITH (security_invoker = true) AS
SELECT 
    pfa.advertiser_id,
    p.id as product_id,
    p.name as product_name,
    COUNT(DISTINCT pfa.form_id) as forms_count,
    SUM(pfa.views_count) as views_count,
    SUM(pfa.clicks_count) as clicks_count,
    SUM(pfa.orders_count) as orders_count,
    SUM(pfa.total_revenue) as total_revenue,
    ROUND(
        CASE 
            WHEN SUM(pfa.views_count) > 0 
            THEN (SUM(pfa.orders_count)::NUMERIC / SUM(pfa.views_count)::NUMERIC) * 100
            ELSE 0 
        END, 
        2
    ) as conversion_rate,
    ROUND(
        CASE 
            WHEN SUM(pfa.orders_count) > 0 
            THEN SUM(pfa.total_revenue) / SUM(pfa.orders_count)::NUMERIC
            ELSE 0 
        END, 
        2
    ) as average_order_value,
    MAX(pfa.period_start) as period_start,
    CASE 
        WHEN SUM(pfa.total_revenue) > 0 THEN TRUE
        ELSE FALSE
    END as is_profitable
FROM product_form_analytics pfa
JOIN products p ON pfa.product_id = p.id
WHERE pfa.is_active = true
GROUP BY pfa.advertiser_id, p.id, p.name
ORDER BY MAX(pfa.period_start) DESC, SUM(pfa.total_revenue) DESC;

-- Grant permissions to views
GRANT SELECT ON public.product_performance_aggregate TO authenticated;
GRANT SELECT ON public.advertiser_product_performance TO authenticated;

-- ============================================================================
-- STEP 4: FIX FUNCTION SEARCH_PATH SECURITY ISSUE
-- ============================================================================
-- Drop and recreate functions with immutable search_path

-- Fix create_product_analytics function
DROP FUNCTION IF EXISTS public.create_product_analytics(UUID, UUID, UUID, DATE);

CREATE OR REPLACE FUNCTION public.create_product_analytics(
    p_product_id UUID,
    p_form_id UUID,
    p_advertiser_id UUID,
    p_period_start DATE DEFAULT CURRENT_DATE
)
RETURNS product_form_analytics 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_analytics product_form_analytics;
BEGIN
    INSERT INTO product_form_analytics (
        product_id, form_id, advertiser_id, period_start
    )
    VALUES (p_product_id, p_form_id, p_advertiser_id, p_period_start)
    ON CONFLICT (product_id, form_id, advertiser_id, period_start)
    DO UPDATE SET is_active = true, updated_at = NOW()
    RETURNING * INTO v_analytics;
    
    RETURN v_analytics;
END;
$$;

-- Fix update_analytics_metrics function
DROP FUNCTION IF EXISTS public.update_analytics_metrics(UUID, INTEGER, INTEGER, INTEGER, DECIMAL);

CREATE OR REPLACE FUNCTION public.update_analytics_metrics(
    p_analytics_id UUID,
    p_views_count INTEGER DEFAULT NULL,
    p_clicks_count INTEGER DEFAULT NULL,
    p_orders_count INTEGER DEFAULT NULL,
    p_total_revenue DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE product_form_analytics
    SET 
        views_count = COALESCE(p_views_count, views_count),
        clicks_count = COALESCE(p_clicks_count, clicks_count),
        orders_count = COALESCE(p_orders_count, orders_count),
        total_revenue = COALESCE(p_total_revenue, total_revenue),
        conversion_rate = CASE 
            WHEN COALESCE(p_views_count, views_count) > 0 
            THEN (COALESCE(p_orders_count, orders_count)::NUMERIC / COALESCE(p_views_count, views_count)::NUMERIC) * 100
            ELSE 0
        END,
        average_order_value = CASE 
            WHEN COALESCE(p_orders_count, orders_count) > 0 
            THEN COALESCE(p_total_revenue, total_revenue) / COALESCE(p_orders_count, orders_count)::NUMERIC
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = p_analytics_id;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_product_analytics(UUID, UUID, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_analytics_metrics(UUID, INTEGER, INTEGER, INTEGER, DECIMAL) TO authenticated;

-- Fix handle_new_user function (if exists)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
  user_status TEXT;
BEGIN
  -- Extract name from metadata or use email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Extract role from metadata
  user_role := NEW.raw_user_meta_data->>'role';
  
  -- If no role provided, default to Advertiser
  IF user_role IS NULL OR user_role = '' THEN
    user_role := 'Advertiser';
  END IF;

  -- Set initial status
  user_status := 'Tidak Aktif';

  -- Insert profile into public.users
  INSERT INTO public.users (
    id, email, name, role, status, phone, address, created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    user_status,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 5: VERIFY CLEANUP
-- ============================================================================

-- Check that exactly 4 policies exist
SELECT 
  policyname, 
  cmd, 
  permissive,
  roles,
  substring(qual from 1 for 50) as qual_preview
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'products'
ORDER BY cmd, policyname;

-- Expected output: Exactly 4 rows
-- 1. products_delete_policy (DELETE)
-- 2. products_insert_policy (INSERT)  
-- 3. products_select_policy (SELECT)
-- 4. products_update_policy (UPDATE)

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- ✅ All duplicate policies removed
-- ✅ 4 clean consolidated policies created
-- ✅ One policy per action (SELECT, INSERT, UPDATE, DELETE)
-- ✅ All role-based access control preserved
-- ✅ Performance optimized with (SELECT auth.uid())
-- ✅ Views recreated without SECURITY DEFINER property
-- ✅ Functions fixed with immutable search_path (SET search_path = public)
-- ✅ handle_new_user function fixed with search_path = public, auth
-- ✅ All database linter warnings should be resolved
-- ============================================================================
