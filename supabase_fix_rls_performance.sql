-- Supabase RLS Performance Optimization
-- Fixes: Auth RLS Initialization Plan & Multiple Permissive Policies
-- Date: 2025-12-04

-- ============================================================================
-- STEP 1: Fix Auth RLS Initialization Plan
-- Replace auth.uid() with (select auth.uid()) to avoid repeated evaluation
-- ============================================================================

-- Fix for users table
DROP POLICY IF EXISTS "Enable all for users" ON public.users;
CREATE POLICY "Enable all for users" ON public.users
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for brands table
DROP POLICY IF EXISTS "Auth full brands" ON public.brands;
CREATE POLICY "Auth full brands" ON public.brands
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for forms table
DROP POLICY IF EXISTS "Auth full forms" ON public.forms;
CREATE POLICY "Auth full forms" ON public.forms
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for orders table
DROP POLICY IF EXISTS "Auth full orders" ON public.orders;
CREATE POLICY "Auth full orders" ON public.orders
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for abandoned_carts table
DROP POLICY IF EXISTS "Auth full carts" ON public.abandoned_carts;
CREATE POLICY "Auth full carts" ON public.abandoned_carts
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for settings table
DROP POLICY IF EXISTS "Auth full settings" ON public.settings;
CREATE POLICY "Auth full settings" ON public.settings
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for cs_agents table
DROP POLICY IF EXISTS "Auth full cs_agents" ON public.cs_agents;
CREATE POLICY "Auth full cs_agents" ON public.cs_agents
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for ad_reports table
DROP POLICY IF EXISTS "Auth full ad_reports" ON public.ad_reports;
CREATE POLICY "Auth full ad_reports" ON public.ad_reports
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- Fix for notifications table
DROP POLICY IF EXISTS "Auth full notifications" ON public.notifications;
CREATE POLICY "Auth full notifications" ON public.notifications
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================================
-- STEP 2: Consolidate Multiple Permissive Policies
-- Combine overlapping policies for same role and action into single policy
-- ============================================================================

-- Consolidate users table policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable all access users" ON public.users;
CREATE POLICY "users_allow_all_delete" ON public.users
  FOR DELETE
  USING (true);

CREATE POLICY "users_allow_all_insert" ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "users_allow_all_select" ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "users_allow_all_update" ON public.users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Consolidate orders table policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable all access orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "orders_allow_all_access" ON public.orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Consolidate forms table policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.forms;
DROP POLICY IF EXISTS "Enable all access forms" ON public.forms;
DROP POLICY IF EXISTS "Public read forms" ON public.forms;
CREATE POLICY "forms_allow_all_access" ON public.forms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Consolidate abandoned_carts table policies
DROP POLICY IF EXISTS "Enable all access abandoned_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Public insert carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Public update carts" ON public.abandoned_carts;
CREATE POLICY "carts_allow_all_access" ON public.abandoned_carts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Consolidate brands table policies
DROP POLICY IF EXISTS "Enable all access brands" ON public.brands;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.brands;
DROP POLICY IF EXISTS "Public read brands" ON public.brands;
CREATE POLICY "brands_allow_all_access" ON public.brands
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Consolidate cs_agents table policies
DROP POLICY IF EXISTS "Enable all access" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable all access cs_agents" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.cs_agents;
CREATE POLICY "cs_agents_allow_all_access" ON public.cs_agents
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Consolidate ad_reports table policies
DROP POLICY IF EXISTS "Enable all access" ON public.ad_reports;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.ad_reports;
CREATE POLICY "ad_reports_allow_all_access" ON public.ad_reports
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Consolidate settings table policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.settings;
DROP POLICY IF EXISTS "Enable all access settings" ON public.settings;
CREATE POLICY "settings_allow_all_access" ON public.settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Consolidate notifications table policies
DROP POLICY IF EXISTS "Enable all access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable all access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for all users" ON public.notifications;
CREATE POLICY "notifications_allow_all_access" ON public.notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 3: Verify Policies (Run after applying fixes)
-- ============================================================================
-- SELECT tablename, policyname, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES:
-- 1. This consolidates permissions - adjust rules if you need role-based RLS
-- 2. Test thoroughly before deploying to production
-- 3. Run policies check query after applying fixes
-- 4. Consider implementing role-based access if needed later
-- 5. Backup your current policies before running this script
-- ============================================================================
