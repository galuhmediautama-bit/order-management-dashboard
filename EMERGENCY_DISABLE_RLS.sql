-- EMERGENCY FIX: Disable RLS on users table for now
-- This is for development/debugging only
-- In production, you should have proper RLS policies

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- DISABLE RLS (allows all authenticated users to read)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- After disabling RLS:
-- 1. Hard refresh browser (Ctrl+Shift+R)
-- 2. Logout and login again
-- 3. Sidebar should load without 406 errors

-- AFTER TESTING, re-enable with proper policies:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Then create proper SELECT policies for each role
