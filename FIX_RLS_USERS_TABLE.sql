-- Fix RLS policies for users table to allow users to read their own data
-- This is needed for Sidebar to load user role information

-- 1. Check current RLS policies on users table
SELECT 
    policyname,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. Allow users to SELECT their own profile
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 3. Allow Super Admin to view all users
CREATE POLICY "Super Admin can view all users"
ON public.users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'Super Admin'
    )
);

-- 4. Allow Admin to view all users
CREATE POLICY "Admin can view all users"
ON public.users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'Admin'
    )
);

-- 5. Allow Keuangan to view all users
CREATE POLICY "Keuangan can view all users"
ON public.users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'Keuangan'
    )
);

-- IMPORTANT NOTES:
-- - Error 406 happens when RLS policy denies access
-- - Each authenticated user should be able to read their own profile (policy 2)
-- - Admin roles should be able to read all users
-- - If policies already exist, you may need to DROP and recreate them

-- To DROP existing policies:
-- DROP POLICY IF EXISTS "policy_name" ON public.users;

-- Then re-run the CREATE POLICY statements above
