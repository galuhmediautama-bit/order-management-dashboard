-- ============================================================================
-- FIX REMAINING DUPLICATE POLICIES
-- ============================================================================
-- Issue: "FOR ALL" policies include SELECT, causing duplicates with "FOR SELECT"
-- Solution: Remove the separate SELECT policies since ALL already covers it
-- ============================================================================

-- ============================================================================
-- 1. ANNOUNCEMENTS - Remove announcements_select (keep announcements_all)
-- ============================================================================
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;

-- ============================================================================
-- 2. BRAND_SETTINGS - Remove brand_settings_select (keep brand_settings_all)
-- ============================================================================
DROP POLICY IF EXISTS "brand_settings_select" ON public.brand_settings;

-- ============================================================================
-- 3. BRAND_SETTINGS_BACKUP - Remove brand_settings_backup_select
-- ============================================================================
DROP POLICY IF EXISTS "brand_settings_backup_select" ON public.brand_settings_backup;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify no more duplicates:
-- 
-- SELECT tablename, array_agg(policyname) as policies, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('announcements', 'brand_settings', 'brand_settings_backup')
-- GROUP BY tablename, cmd, roles
-- HAVING COUNT(*) > 1;
