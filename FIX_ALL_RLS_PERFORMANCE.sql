-- ============================================================================
-- COMPREHENSIVE RLS PERFORMANCE FIX
-- ============================================================================
-- Based on actual policies from database export
-- 
-- This script fixes ALL RLS performance issues detected by Supabase Linter:
-- 1. auth_rls_initplan: Replace auth.uid() with (SELECT auth.uid())
-- 2. multiple_permissive_policies: Remove duplicate policies
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: NOTIFICATIONS TABLE
-- Issues: System can insert + Users can insert (duplicate INSERT)
--         auth_rls_initplan on "System can insert notifications"
-- ============================================================================

-- Drop all existing notification policies
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- Create optimized policies with (SELECT auth.uid())
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.role()) = 'service_role'
    );

CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 2: PRODUCTS TABLE
-- Issues: 8 duplicate policies (2 for each action)
--         auth_rls_initplan on products_delete_admin
-- ============================================================================

-- Drop all existing product policies
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- Create single optimized policies
CREATE POLICY "products_select" ON public.products
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "products_insert" ON public.products
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "products_update" ON public.products
    FOR UPDATE USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "products_delete" ON public.products
    FOR DELETE USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================================
-- PART 3: SETTINGS TABLE
-- Issues: 10 policies! Many duplicates
--         auth_rls_initplan on multiple policies
-- ============================================================================

-- Drop ALL existing settings policies
DROP POLICY IF EXISTS "settings_update_admin" ON public.settings;
DROP POLICY IF EXISTS "Allow Super Admin write" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.settings;
DROP POLICY IF EXISTS "Public read access to settings" ON public.settings;
DROP POLICY IF EXISTS "settings_insert_admin" ON public.settings;
DROP POLICY IF EXISTS "settings_read_auth" ON public.settings;
DROP POLICY IF EXISTS "settings_select_authenticated" ON public.settings;
DROP POLICY IF EXISTS "settings_select_permissive" ON public.settings;
DROP POLICY IF EXISTS "settings_write_admin" ON public.settings;
DROP POLICY IF EXISTS "Admin only write access to settings" ON public.settings;

-- Create single optimized policies
CREATE POLICY "settings_select" ON public.settings
    FOR SELECT USING (true); -- Public read

CREATE POLICY "settings_insert" ON public.settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "settings_update" ON public.settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "settings_delete" ON public.settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- PART 4: USERS TABLE
-- Issues: Multiple INSERT, UPDATE, DELETE policies
--         auth_rls_initplan on several policies
-- ============================================================================

-- Drop all duplicate user policies
DROP POLICY IF EXISTS "users_update_by_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_allow_all_delete" ON public.users;
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "Users can insert with signup" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;

-- Create single optimized policies
CREATE POLICY "users_select" ON public.users
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "users_insert" ON public.users
    FOR INSERT WITH CHECK (
        id = (SELECT auth.uid()) -- Self signup
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "users_update" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "users_delete" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- PART 5: BRAND_SETTINGS TABLE
-- Issues: Duplicate SELECT policies
--         auth_rls_initplan
-- ============================================================================

DROP POLICY IF EXISTS "brand_settings_read_auth" ON public.brand_settings;
DROP POLICY IF EXISTS "brand_settings_write_admin" ON public.brand_settings;

CREATE POLICY "brand_settings_select" ON public.brand_settings
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "brand_settings_all" ON public.brand_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- PART 6: BRAND_SETTINGS_BACKUP TABLE
-- Issues: Duplicate SELECT policies
--         auth_rls_initplan
-- ============================================================================

DROP POLICY IF EXISTS "brand_settings_backup_write_admin" ON public.brand_settings_backup;
DROP POLICY IF EXISTS "brand_settings_backup_read_auth" ON public.brand_settings_backup;

CREATE POLICY "brand_settings_backup_select" ON public.brand_settings_backup
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "brand_settings_backup_all" ON public.brand_settings_backup
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- PART 7: ANNOUNCEMENTS TABLE
-- Issues: Duplicate SELECT (write_admin ALL includes SELECT)
-- ============================================================================

DROP POLICY IF EXISTS "announcements_write_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_read_public" ON public.announcements;

CREATE POLICY "announcements_select" ON public.announcements
    FOR SELECT USING (true); -- Public read

CREATE POLICY "announcements_all" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- PART 8: FORMS TABLE
-- Issues: forms_allow_all_access + specific policies = duplicates
-- ============================================================================

DROP POLICY IF EXISTS "forms_insert_authenticated" ON public.forms;
DROP POLICY IF EXISTS "forms_update_authenticated" ON public.forms;
DROP POLICY IF EXISTS "forms_select_authenticated" ON public.forms;
DROP POLICY IF EXISTS "forms_allow_all_access" ON public.forms;

-- Public can view forms (for FormViewerPage - anonymous users)
CREATE POLICY "forms_select" ON public.forms
    FOR SELECT USING (true);

-- Authenticated can manage
CREATE POLICY "forms_insert" ON public.forms
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "forms_update" ON public.forms
    FOR UPDATE USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "forms_delete" ON public.forms
    FOR DELETE USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================================
-- PART 9: ORDERS TABLE
-- Issues: orders_allow_all_access + specific policies = duplicates
-- ============================================================================

DROP POLICY IF EXISTS "orders_allow_all_access" ON public.orders;
DROP POLICY IF EXISTS "orders_select_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_update_authenticated" ON public.orders;

-- Public can insert orders (FormViewerPage submits as anonymous)
CREATE POLICY "orders_insert" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Authenticated can view and manage
CREATE POLICY "orders_select" ON public.orders
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "orders_update" ON public.orders
    FOR UPDATE USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "orders_delete" ON public.orders
    FOR DELETE USING ((SELECT auth.role()) = 'authenticated');

-- ============================================================================
-- VERIFICATION QUERY
-- Run after executing the above to verify all policies are correct
-- ============================================================================
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('notifications', 'products', 'settings', 'users', 
--                     'brand_settings', 'brand_settings_backup', 
--                     'announcements', 'forms', 'orders')
-- ORDER BY tablename, cmd;
