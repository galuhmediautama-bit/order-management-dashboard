-- ============================================
-- DEBUG: Check what's causing 500 errors
-- Run this in Supabase SQL Editor
-- ============================================

-- Check if RLS policies exist and are valid
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'orders', 'forms', 'products', 'settings')
ORDER BY tablename, cmd, policyname;

-- Check if tables exist
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'orders', 'forms', 'products', 'settings')
ORDER BY table_name;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'orders', 'forms', 'products', 'settings');
