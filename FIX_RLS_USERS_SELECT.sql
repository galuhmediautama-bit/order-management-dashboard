-- ============================================
-- FIX: Update RLS policies to allow Admin/Super Admin to see all users
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the restrictive users_select_basic policy
DROP POLICY IF EXISTS "users_select_basic" ON public.users;

-- Step 2: Create new permissive policy for Admin/Super Admin to see all users
-- This allows:
-- - Super Admin and Admin roles to see ALL users
-- - Other users to see only users with status 'Aktif' or themselves
CREATE POLICY "users_select_with_role_check" ON public.users
FOR SELECT
USING (
    -- Super Admin and Admin can see everyone
    (auth.uid() IS NOT NULL AND role = ANY (ARRAY['Super Admin'::text, 'Admin'::text]))
    OR
    -- Other authenticated users can see themselves or active users
    (auth.uid() IS NOT NULL AND ((id = auth.uid()) OR (status = 'Aktif'::text)))
    OR
    -- If no status or null, still allow Super Admin/Admin
    (status IS NULL AND role = ANY (ARRAY['Super Admin'::text, 'Admin'::text]))
);

-- Step 3: Verify the policy was created
SELECT policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'users_select_with_role_check';

-- Step 4: Test query - should work now
SELECT id, name, email, role, status
FROM users
LIMIT 5;

-- Step 5: Verify no more restrictive users_select_basic
SELECT COUNT(*) as policies_count
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'users_select_basic';
-- Should return: 0
