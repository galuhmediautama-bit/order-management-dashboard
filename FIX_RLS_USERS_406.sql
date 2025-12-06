-- Add additional RLS policies to fix 406 error on users table
-- The issue is that authenticated users need to read their own profile for Sidebar

-- 1. First, let's see if there's a default deny-all policy
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. Add a permissive SELECT policy for authenticated users reading their own profile
-- This is in addition to existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON public.users;

CREATE POLICY "Allow authenticated users to read own profile"
ON public.users
FOR SELECT
USING (
    auth.uid() IS NOT NULL AND auth.uid() = id
);

-- 3. If you need Admin/Super Admin to read all users for settings:
DROP POLICY IF EXISTS "Admin roles can read all users" ON public.users;

CREATE POLICY "Admin roles can read all users"
ON public.users
FOR SELECT
USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.users u2
        WHERE u2.id = auth.uid() 
        AND u2.role IN ('Super Admin', 'Admin')
    )
);

-- 4. Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- VERIFICATION QUERIES:
-- Check if policies are applied correctly
SELECT 
    tablename,
    policyname,
    permissive,
    (qual IS NOT NULL) as has_qual,
    (with_check IS NOT NULL) as has_with_check
FROM pg_policies
WHERE tablename = 'users';

-- Test if current user can read their own profile
-- Run this as the authenticated user (5jamsaja@gmail.com)
-- SELECT id, email, role FROM public.users WHERE id = auth.uid();
