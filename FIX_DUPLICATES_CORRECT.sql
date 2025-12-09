-- ============================================================================
-- FIX DUPLICATE POLICIES - CORRECT VERSION
-- ============================================================================
-- Problem: _all (admin only) + _select (public/auth) = duplicate SELECT
-- Solution: Modify _all to include SELECT for everyone, keep write for admin
-- ============================================================================

-- ============================================================================
-- 1. ANNOUNCEMENTS
-- Current: announcements_all (admin) + announcements_select (public)
-- Fix: Keep one SELECT (public), one for INSERT/UPDATE/DELETE (admin)
-- ============================================================================

-- Drop both policies
DROP POLICY IF EXISTS "announcements_all" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;

-- Create single SELECT policy (everyone can read)
CREATE POLICY "announcements_select" ON public.announcements
    FOR SELECT
    USING (true);

-- Create admin-only write policies (INSERT, UPDATE, DELETE)
CREATE POLICY "announcements_insert" ON public.announcements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "announcements_update" ON public.announcements
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "announcements_delete" ON public.announcements
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- 2. BRAND_SETTINGS
-- Current: brand_settings_all (admin) + brand_settings_select (authenticated)
-- Fix: Keep one SELECT (authenticated), one for INSERT/UPDATE/DELETE (admin)
-- ============================================================================

-- Drop both policies
DROP POLICY IF EXISTS "brand_settings_all" ON public.brand_settings;
DROP POLICY IF EXISTS "brand_settings_select" ON public.brand_settings;

-- Create single SELECT policy (authenticated users can read)
CREATE POLICY "brand_settings_select" ON public.brand_settings
    FOR SELECT
    USING ((SELECT auth.role()) = 'authenticated');

-- Create admin-only write policies
CREATE POLICY "brand_settings_insert" ON public.brand_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "brand_settings_update" ON public.brand_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "brand_settings_delete" ON public.brand_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- 3. BRAND_SETTINGS_BACKUP
-- Current: brand_settings_backup_all (admin) + brand_settings_backup_select (authenticated)
-- Fix: Same as brand_settings
-- ============================================================================

-- Drop both policies
DROP POLICY IF EXISTS "brand_settings_backup_all" ON public.brand_settings_backup;
DROP POLICY IF EXISTS "brand_settings_backup_select" ON public.brand_settings_backup;

-- Create single SELECT policy (authenticated users can read)
CREATE POLICY "brand_settings_backup_select" ON public.brand_settings_backup
    FOR SELECT
    USING ((SELECT auth.role()) = 'authenticated');

-- Create admin-only write policies
CREATE POLICY "brand_settings_backup_insert" ON public.brand_settings_backup
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "brand_settings_backup_update" ON public.brand_settings_backup
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

CREATE POLICY "brand_settings_backup_delete" ON public.brand_settings_backup
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('Super Admin', 'Admin')
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this after to verify:
--
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('announcements', 'brand_settings', 'brand_settings_backup')
-- ORDER BY tablename, policyname;
--
-- Expected: Each table should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- No more duplicates because each action has exactly ONE policy
