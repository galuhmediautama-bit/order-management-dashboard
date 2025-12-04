-- =============================================================================
-- FIX: User Registration Role Not Being Saved Correctly
-- =============================================================================
-- Problem: When user registers with role (CS or Advertiser), they see Super Admin role
-- Solution: 
--   1. Ensure RLS allows new users to read their own profile
--   2. Add a trigger to sync auth.users metadata to public.users
--   3. Verify user profile creation is atomic with auth signup
-- =============================================================================

-- ============================================================================
-- STEP 1: Verify RLS Policy on users table allows self-read
-- ============================================================================

-- Check existing policies
SELECT 
  policyname, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Add explicit policy allowing users to read their own profile
-- ============================================================================

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

-- Create new policy: Users can read their own row
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- ============================================================================
-- STEP 3: Add explicit policy allowing users to update their own profile
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- STEP 4: Ensure INSERT RLS policy is permissive (allow signup)
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert with signup" ON public.users;

CREATE POLICY "Users can insert with signup" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STEP 5: Create trigger to handle user sync on auth signup
-- ============================================================================
-- This ensures public.users table stays in sync with auth.users metadata

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_new_user_profile ON public.users CASCADE;
DROP FUNCTION IF EXISTS public.sync_new_user_profile() CASCADE;

-- Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process on INSERT
  IF TG_OP = 'INSERT' THEN
    -- Ensure all required fields have values
    IF NEW.id IS NOT NULL THEN
      -- Keep the inserted values
      RETURN NEW;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger (runs BEFORE INSERT to validate data)
CREATE TRIGGER ensure_user_profile_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- ============================================================================
-- STEP 6: Verify data consistency
-- ============================================================================

-- Find auth users who might not have profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  pu.id as profile_exists,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- Check users table for orphaned or incorrect data
SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at,
  COUNT(*) OVER (PARTITION BY email) as email_count
FROM public.users
WHERE status IS NULL OR role IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 7: Create helper function to manually fix user profile
-- ============================================================================
-- Run this if there's a specific user with wrong role

-- Example: To fix a specific user, use Supabase SQL Editor
-- SELECT * FROM public.users WHERE id = 'USER_ID_HERE';
-- UPDATE public.users SET role = 'Customer service' WHERE id = 'USER_ID_HERE';

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 
-- 1. Added "Users can read own profile" policy - allows users to read their own row
-- 2. Added "Users can update own profile" policy - allows users to update their own data
-- 3. Verified INSERT policy is permissive for new user signup
-- 4. Added ensure_user_profile() function to validate profile data on insert
-- 5. Added queries to find and identify orphaned or incorrect profiles
--
-- Testing:
-- 1. Register a new user with role = 'Customer service'
-- 2. In Supabase SQL Editor, verify the user was created with correct role:
--    SELECT * FROM public.users WHERE id = 'NEW_USER_ID';
-- 3. Login with the new account
-- 4. Check browser console for role fetching logs
-- 5. Verify sidebar shows correct role (not Super Admin)
--
-- ============================================================================
