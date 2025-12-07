-- ============================================================
-- NOTIFICATIONS DATABASE SYNCHRONIZATION CHECK
-- ============================================================
-- This script verifies if notifications are properly synced
-- between frontend state and Supabase database

-- 1. CHECK TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. COUNT TOTAL NOTIFICATIONS
SELECT 
    COUNT(*) as total_notifications,
    SUM(CASE WHEN read = true THEN 1 ELSE 0 END) as read_count,
    SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread_count
FROM notifications;

-- 3. LIST ALL NOTIFICATIONS (recent first)
SELECT 
    id,
    type,
    message,
    read,
    created_at,
    LENGTH(message) as msg_length,
    LENGTH(id) as id_length
FROM notifications
ORDER BY created_at DESC
LIMIT 30;

-- 4. CHECK FOR DUPLICATE NOTIFICATIONS
SELECT 
    type,
    message,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM notifications
GROUP BY type, message
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 5. CHECK NOTIFICATIONS BY TYPE
SELECT 
    type,
    COUNT(*) as count,
    SUM(CASE WHEN read = true THEN 1 ELSE 0 END) as read,
    SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- 6. CHECK RLS POLICIES ON NOTIFICATIONS TABLE
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 7. CHECK FOR NULL VALUES IN CRITICAL COLUMNS
SELECT 
    'id' as column_name,
    COUNT(*) as null_count
FROM notifications
WHERE id IS NULL
UNION ALL
SELECT 
    'message',
    COUNT(*)
FROM notifications
WHERE message IS NULL
UNION ALL
SELECT 
    'type',
    COUNT(*)
FROM notifications
WHERE type IS NULL
UNION ALL
SELECT 
    'read',
    COUNT(*)
FROM notifications
WHERE read IS NULL;

-- 8. CHECK LATEST 10 NOTIFICATIONS WITH FULL DETAILS
SELECT 
    id,
    type,
    message,
    read,
    user_id,
    created_at,
    updated_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- 9. CHECK IF NOTIFICATIONS TABLE HAS REALTIME ENABLED
SELECT 
    schemaname,
    tablename,
    replication_enabled
FROM pg_tables
WHERE tablename = 'notifications';

-- 10. CHECK TRIGGER FUNCTIONS ON NOTIFICATIONS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'notifications'
ORDER BY trigger_name;
