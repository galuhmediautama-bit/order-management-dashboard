-- TEMPORARY: Disable RLS to test if that's the blocker
-- If app works fine with RLS disabled, then problem is RLS policy

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- After this:
-- 1. Hard refresh browser (Ctrl+Shift+R)
-- 2. Logout completely
-- 3. Login again with Advertiser user
-- 4. If sidebar works, then RLS is the problem
-- 5. If still error, then problem is elsewhere

-- To re-enable RLS after testing:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
