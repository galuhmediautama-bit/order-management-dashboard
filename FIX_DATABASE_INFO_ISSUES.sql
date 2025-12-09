-- ============================================================================
-- FIX DATABASE PERFORMANCE - INFO LEVEL ISSUES
-- ============================================================================
-- Level: INFO (lower priority than WARN, but good to fix)
-- ============================================================================

-- ============================================================================
-- PART 1: ADD MISSING INDEXES ON FOREIGN KEYS
-- Issue: unindexed_foreign_keys
-- ============================================================================

-- 1.1 announcements.createdBy - Foreign key without index
CREATE INDEX IF NOT EXISTS idx_announcements_createdby 
    ON public.announcements ("createdBy");

-- 1.2 orders.assignedCsId - Foreign key without index
CREATE INDEX IF NOT EXISTS idx_orders_assignedcsid 
    ON public.orders ("assignedCsId");

-- ============================================================================
-- PART 2: ADD PRIMARY KEY TO brand_settings_backup
-- Issue: no_primary_key
-- ============================================================================

-- First check if there's a unique column we can use
-- If 'id' column exists, make it primary key
-- If not, we need to add one

-- Option A: If 'id' column exists but not primary key
-- ALTER TABLE public.brand_settings_backup ADD PRIMARY KEY (id);

-- Option B: If no 'id' column, add one
-- ALTER TABLE public.brand_settings_backup ADD COLUMN id SERIAL PRIMARY KEY;

-- Run this query first to check table structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'brand_settings_backup';

-- ============================================================================
-- PART 3: REMOVE UNUSED INDEXES (OPTIONAL - SAVES STORAGE)
-- Issue: unused_index
-- ============================================================================
-- WARNING: Only remove if you're SURE these won't be needed
-- These indexes take up storage space but aren't being used
-- 
-- RECOMMENDATION: Keep these for now, monitor usage
-- Only remove after 30+ days of no usage in production

-- Users table unused indexes
-- DROP INDEX IF EXISTS idx_users_columnvisibility;
-- DROP INDEX IF EXISTS idx_users_phone;

-- Forms table unused indexes
-- DROP INDEX IF EXISTS idx_forms_brandid;

-- Notifications table unused indexes
-- DROP INDEX IF EXISTS idx_notifications_user_id;
-- DROP INDEX IF EXISTS idx_notifications_type;
-- DROP INDEX IF EXISTS idx_notifications_is_deleted;

-- Product_form_analytics unused indexes
-- DROP INDEX IF EXISTS idx_analytics_form_id;
-- DROP INDEX IF EXISTS idx_analytics_period;

-- Orders table unused indexes
-- DROP INDEX IF EXISTS idx_orders_assignedadvid;
-- DROP INDEX IF EXISTS idx_orders_variant;
-- DROP INDEX IF EXISTS idx_orders_scheduleddeletiondate;

-- Products table unused indexes
-- DROP INDEX IF EXISTS idx_products_is_featured;
-- DROP INDEX IF EXISTS idx_products_created_at;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check new indexes were created:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE indexname IN ('idx_announcements_createdby', 'idx_orders_assignedcsid');

-- Check brand_settings_backup structure:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'brand_settings_backup';
