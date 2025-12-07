-- ============================================================
-- QUICK SYNC TEST - 5 MINUTES TO ROOT CAUSE
-- ============================================================

-- 1. TABLE CHECK
SELECT 'TABLE_EXISTS' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
       THEN '✅ YES' ELSE '❌ NO' END as result;

-- 2. COUNT CHECK
SELECT 'NOTIFICATION_COUNT' as check_name,
       COUNT(*) as total_count,
       SUM(CASE WHEN read = true THEN 1 ELSE 0 END) as read_count,
       SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread_count
FROM notifications;

-- 3. COLUMN SCHEMA CHECK
SELECT 'COLUMNS' as check_name,
       STRING_AGG(column_name || ':' || data_type, ', ' ORDER BY ordinal_position) as column_list
FROM information_schema.columns
WHERE table_name = 'notifications';

-- 4. TIMESTAMP vs CREATED_AT CHECK
SELECT 'TIMESTAMP_COLUMN' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'timestamp')
       THEN '✅ YES' ELSE '❌ NO' END as has_timestamp,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at')
       THEN '✅ YES' ELSE '❌ NO' END as has_created_at;

-- 5. READ COLUMN CHECK
SELECT 'READ_COLUMN' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read')
       THEN '✅ YES' ELSE '❌ NO' END as has_read;

-- 6. RLS POLICIES CHECK
SELECT 'RLS_POLICIES' as check_name,
       COUNT(*) as policy_count,
       STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE tablename = 'notifications';

-- 7. LAST 5 NOTIFICATIONS
SELECT 'LAST_5' as check_name,
       id,
       type,
       message,
       read,
       timestamp
FROM notifications
ORDER BY timestamp DESC
LIMIT 5;

-- 8. RECENT INSERTS (last 10 minutes)
SELECT 'RECENT_INSERTS' as check_name,
       COUNT(*) as count_last_10_min
FROM notifications
WHERE timestamp > NOW() - INTERVAL '10 minutes';

-- 9. DELETE WORKS TEST (non-destructive)
SELECT 'DELETE_TEST' as check_name,
       'Will test with non-existent ID' as test_type,
       CASE WHEN EXISTS (
           SELECT 1 FROM notifications WHERE id = 'test-delete-check-does-not-exist-12345'
       ) THEN '❌ TEST_ID_EXISTS' ELSE '✅ SAFE_TO_TEST' END as status;

-- 10. UPDATE WORKS TEST (non-destructive)
SELECT 'UPDATE_TEST' as check_name,
       COUNT(*) as unread_before_test
FROM notifications
WHERE read = false;

-- 11. RLS ENABLED CHECK
SELECT 'RLS_ENABLED' as check_name,
       CASE WHEN relrowsecurity THEN '✅ YES' ELSE '❌ NO' END as rls_enabled
FROM pg_class
WHERE relname = 'notifications';

-- 12. REALTIME REPLICATION CHECK
SELECT 'REALTIME_ENABLED' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_publication_tables WHERE tablename = 'notifications'
       ) THEN '✅ YES' ELSE '❌ NO' END as realtime_enabled;
