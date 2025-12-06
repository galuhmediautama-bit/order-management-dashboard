-- FINAL FIX: Drop conflicting policies and create clean ones
-- The 406 error means RLS is denying the query

-- Step 1: Drop ALL existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin roles can read all users" ON public.users;
DROP POLICY IF EXISTS "Super Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin roles can read all users" ON public.users;
DROP POLICY IF EXISTS "Keuangan can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Step 2: Create ONE clean SELECT policy
-- Allow ANY authenticated user to read their own row
CREATE POLICY "users_select_own" ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Step 3: If you need Admins to read all users (for settings page)
-- Create a separate PERMISSIVE policy
CREATE POLICY "admin_select_all_users" ON public.users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users AS u
        WHERE u.id = auth.uid()
        AND u.role IN ('Super Admin', 'Admin')
    )
);

-- Step 4: Verify RLS is ENABLED
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Check what policies exist now
SELECT 
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- NOTES:
-- - Policy names should be descriptive but short
-- - PERMISSIVE policies ALLOW access
-- - RESTRICTIVE policies DENY access
-- - User can now read their own profile: SELECT * FROM users WHERE id = auth.uid()
-- - After this, hard refresh browser and logout/login again
