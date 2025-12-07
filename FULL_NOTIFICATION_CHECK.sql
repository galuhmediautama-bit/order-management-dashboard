-- ============================================================
-- COMPREHENSIVE NOTIFICATION SYNC CHECK
-- ============================================================
-- Copy and run this in Supabase SQL Editor

-- 1. TABLE EXISTS CHECK
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
) as table_exists;

-- 2. TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 3. REALTIME ENABLED?
SELECT 
    schemaname,
    tablename,
    replication_enabled
FROM pg_publication_tables
WHERE tablename = 'notifications';

-- 4. RLS POLICIES ACTIVE?
SELECT 
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 5. COUNT NOTIFICATIONS
SELECT 
    COUNT(*) as total_notifs,
    COUNT(CASE WHEN read = true THEN 1 END) as read_count,
    COUNT(CASE WHEN read = false THEN 1 END) as unread_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT type) as unique_types
FROM notifications;

-- 6. RECENT NOTIFICATIONS (last 20)
SELECT 
    id,
    type,
    message,
    read,
    user_id,
    timestamp,
    created_at,
    LENGTH(id) as id_len
FROM notifications
ORDER BY timestamp DESC
LIMIT 20;

-- 7. NOTIFICATIONS BY TYPE
SELECT 
    type,
    COUNT(*) as count,
    SUM(CASE WHEN read = true THEN 1 ELSE 0 END) as read,
    SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- 8. OLDEST vs NEWEST
SELECT 
    MIN(timestamp) as oldest_notification,
    MAX(timestamp) as newest_notification,
    AGE(MAX(timestamp), MIN(timestamp)) as time_span
FROM notifications;

-- 9. CHECK FOR NULL VALUES
SELECT 
    'id' as column_name,
    COUNT(*) as null_count,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM notifications) as percentage
FROM notifications
WHERE id IS NULL
UNION ALL
SELECT 'type', COUNT(*), COUNT(*) * 100.0 / (SELECT COUNT(*) FROM notifications)
FROM notifications WHERE type IS NULL
UNION ALL
SELECT 'message', COUNT(*), COUNT(*) * 100.0 / (SELECT COUNT(*) FROM notifications)
FROM notifications WHERE message IS NULL
UNION ALL
SELECT 'read', COUNT(*), COUNT(*) * 100.0 / (SELECT COUNT(*) FROM notifications)
FROM notifications WHERE read IS NULL;

-- 10. DUPLICATE CHECK
SELECT 
    type,
    message,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(timestamp) as first_created,
    MAX(timestamp) as last_created
FROM notifications
GROUP BY type, message
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 11. CHECK INDEXES
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
ORDER BY indexname;

-- 12. TRIGGER FUNCTIONS
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'notifications'
ORDER BY trigger_name;
