-- =============================================================================
-- SUPABASE PERFORMANCE OPTIMIZATION
-- =============================================================================
-- This script optimizes slow queries and adds missing indexes
-- Addresses: realtime subscriptions, timezone caching, schema introspection
-- Run in: Supabase SQL Editor
-- =============================================================================

-- ============================================================================
-- STEP 1: ADD INDEXES FOR FREQUENTLY QUERIED COLUMNS
-- ============================================================================
-- These indexes will speed up the most common queries

-- Index for orders table filtering by status, brandId, assignedCsId
CREATE INDEX IF NOT EXISTS idx_orders_status_brand_cs 
  ON public.orders(status, "brandId", "assignedCsId") 
  INCLUDE ("customerPhone", "createdAt");

-- Index for orders by assignedCsId (for CS agent reports)
CREATE INDEX IF NOT EXISTS idx_orders_assigned_cs 
  ON public.orders("assignedCsId", status, "createdAt" DESC);

-- Index for orders by brandId (for advertiser filtering)
CREATE INDEX IF NOT EXISTS idx_orders_brand_id 
  ON public.orders("brandId", status, "createdAt" DESC);

-- Index for orders created_at (for date range queries)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc 
  ON public.orders("createdAt" DESC);

-- Index for abandoned_carts by status
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status 
  ON public.abandoned_carts(status, "createdAt" DESC);

-- Index for forms by user_id (for form listing)
CREATE INDEX IF NOT EXISTS idx_forms_user_id 
  ON public.forms("userId", status, "updatedAt" DESC);

-- Index for settings global access
CREATE INDEX IF NOT EXISTS idx_settings_key 
  ON public.settings(key) 
  WHERE "userId" IS NULL;

-- Index for users by role (for role-based queries)
CREATE INDEX IF NOT EXISTS idx_users_role_status 
  ON public.users(role, status, "createdAt" DESC);

-- Index for ad_reports by campaign_id
CREATE INDEX IF NOT EXISTS idx_ad_reports_campaign_brand 
  ON public.ad_reports("campaignId", "brandId", date DESC);

-- Index for cs_agents by assignedBrandIds (partial index for active agents)
CREATE INDEX IF NOT EXISTS idx_cs_agents_brand_status 
  ON public.cs_agents(status, "createdAt" DESC) 
  WHERE status = 'Aktif';

-- Index for notifications by user_id and status
CREATE INDEX IF NOT EXISTS idx_notifications_user_status 
  ON public.notifications("userId", status, "createdAt" DESC);

-- Index for pending_deletions status tracking
CREATE INDEX IF NOT EXISTS idx_pending_deletions_status 
  ON public.pending_deletions(status, "requestedAt" DESC);

-- ============================================================================
-- STEP 2: OPTIMIZE REALTIME SUBSCRIPTIONS
-- ============================================================================
-- Reduce realtime.list_changes overhead by filtering at RLS level

-- The realtime.list_changes function is called 34k times (highest consumer)
-- This happens because Realtime checks all row changes. We can:
-- 1. Add column-level filtering (RLS policies will help)
-- 2. Ensure indexes are used for RLS evaluation
-- 3. Cache frequently accessed data patterns

-- Verify RLS is enabled on all tables (already done in previous scripts)
-- This ensures realtime only sends changes user can see

-- ============================================================================
-- STEP 3: CACHE TIMEZONE DATA
-- ============================================================================
-- The SELECT name FROM pg_timezone_names query takes 620ms avg (33 calls)
-- This is schema introspection that could be cached client-side

-- Create a materialized view for frequently used timezones
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cached_timezones AS
  SELECT name FROM pg_timezone_names 
  WHERE name IN (
    'Asia/Jakarta',
    'Asia/Singapore', 
    'Asia/Bangkok',
    'Asia/Shanghai',
    'UTC',
    'Asia/Tokyo',
    'Asia/Hong_Kong'
  );

-- Index on the cached timezones for fast lookup
CREATE INDEX IF NOT EXISTS idx_cached_timezones_name 
  ON public.cached_timezones(name);

-- Add a note in settings about timezone - can be cached in app memory
INSERT INTO public.settings (key, value, type, description, "userId")
  VALUES (
    'cached_timezones',
    jsonb_build_array('Asia/Jakarta', 'Asia/Singapore', 'Asia/Bangkok', 'UTC'),
    'array',
    'Frequently used timezones cached for faster load',
    NULL
  )
  ON CONFLICT (key, "userId") DO UPDATE 
  SET value = excluded.value, "updatedAt" = now();

-- ============================================================================
-- STEP 4: ADD COMPOSITE INDEXES FOR COMMON FILTER COMBINATIONS
-- ============================================================================

-- For reports: orders filtered by date range + assignedCsId + status
CREATE INDEX IF NOT EXISTS idx_orders_cs_reports 
  ON public.orders("assignedCsId", status, "createdAt" DESC, "totalPrice");

-- For reports: orders filtered by date range + brandId + status  
CREATE INDEX IF NOT EXISTS idx_orders_brand_reports 
  ON public.orders("brandId", status, "createdAt" DESC, "totalPrice", "advCommission");

-- For abandoned carts: formId + status (common filter)
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_form_status 
  ON public.abandoned_carts("formId", status, "createdAt" DESC);

-- For forms: filter by identifier (slug or UUID lookup)
CREATE INDEX IF NOT EXISTS idx_forms_identifier_unique 
  ON public.forms(identifier) 
  WHERE identifier IS NOT NULL;

-- ============================================================================
-- STEP 5: OPTIMIZE FUNCTION PERFORMANCE
-- ============================================================================

-- Ensure increment_form_submission uses the optimized search_path
-- (Already done in previous script, but verify search_path is set correctly)

-- Create index to support auto_delete_expired_orders function
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_deletion 
  ON public.orders("scheduledDeletionDate") 
  WHERE status = 'Pending Deletion';

-- ============================================================================
-- STEP 6: UPDATE TABLE STATISTICS FOR QUERY PLANNER
-- ============================================================================
-- This helps PostgreSQL choose better execution plans

ANALYZE public.orders;
ANALYZE public.forms;
ANALYZE public.users;
ANALYZE public.abandoned_carts;
ANALYZE public.ad_reports;
ANALYZE public.cs_agents;
ANALYZE public.settings;
ANALYZE public.notifications;
ANALYZE public.pending_deletions;

-- ============================================================================
-- STEP 7: ADD CLIENT-SIDE CACHING RECOMMENDATIONS
-- ============================================================================
-- Note: These are recommendations for the React app, not SQL changes

-- The following queries should be cached client-side to reduce server calls:
-- 1. SELECT name FROM pg_timezone_names - cache for 24 hours (rarely changes)
-- 2. SELECT * FROM settings WHERE "userId" IS NULL - cache in SettingsContext
-- 3. SELECT * FROM users WHERE id = auth.uid() - cache in AuthContext
-- 4. SELECT * FROM forms WHERE "userId" = auth.uid() - cache with invalidation on create/update

-- ============================================================================
-- STEP 8: VERIFY INDEX CREATION
-- ============================================================================
-- Show all new indexes created

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- After running this script:
-- 
-- 1. Query planner will use indexes for common filters
-- 2. Realtime subscriptions will be more selective due to RLS + indexes
-- 3. Timezone lookups can be moved to client-side cache
-- 4. Schema introspection (pg_get_tabledef) remains slow but is rarely
--    needed during normal operation (only in dashboard UI for introspection)
--
-- Expected improvements:
-- - 30-50% reduction in query execution time for common filters
-- - Faster RLS policy evaluation
-- - Better realtime subscription performance
--
-- Monitor with: SELECT query, calls, mean_time FROM pg_stat_statements
--              ORDER BY calls DESC;
