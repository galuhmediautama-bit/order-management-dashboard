-- ============================================================================
-- AUTOMATIC USER PROFILE CREATION TRIGGER
-- ============================================================================
-- This script creates a database trigger that automatically creates a profile
-- in public.users whenever a new user registers in auth.users
--
-- Benefits:
-- 1. No race conditions - database handles sync atomically
-- 2. No email confirmation blocking - works immediately
-- 3. No application code changes needed
-- 4. Guaranteed consistency between auth.users and public.users
--
-- Usage: Run this script in Supabase SQL Editor
-- ============================================================================

-- Step 0: Ensure phone and address columns exist in users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Step 1: Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
  user_status TEXT;
BEGIN
  -- Extract name from metadata or use email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Extract role from metadata (MUST be provided during signup)
  user_role := NEW.raw_user_meta_data->>'role';
  
  -- Log what we received for debugging
  RAISE NOTICE 'User signup: email=%, metadata_role=%, full_name=%', 
    NEW.email, 
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'full_name';
  
  -- If no role provided, default to Advertiser
  IF user_role IS NULL OR user_role = '' THEN
    user_role := 'Advertiser';
    RAISE WARNING 'No role in metadata for %, defaulting to Advertiser', NEW.email;
  END IF;

  -- Set initial status (change to 'Aktif' if you want auto-approval)
  user_status := 'Tidak Aktif';  -- Users start as pending by default

  -- Insert profile into public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    phone,
    address,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    user_status,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    NOW()
  );

  -- Log the profile creation with actual role saved
  RAISE NOTICE 'Auto-created profile for user: % with role: % (status: %)', NEW.email, user_role, user_status;

  RETURN NEW;
END;
$$;

-- Step 2: Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create missing profiles for existing auth users (cleanup)
INSERT INTO public.users (id, email, name, role, status, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as name,
  COALESCE(au.raw_user_meta_data->>'role', 'Admin') as role,
  'Tidak Aktif' as status,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- Step 4: Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 5: Show all users to verify sync
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  au.raw_user_meta_data->>'role' as metadata_role,
  pu.name,
  pu.role as current_role,
  pu.status,
  CASE 
    WHEN pu.id IS NULL THEN '❌ MISSING'
    ELSE '✅ SYNCED'
  END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
ORDER BY au.created_at DESC;

-- Step 6: Update existing users with correct role from metadata (if exists)
UPDATE public.users pu
SET 
  role = COALESCE(au.raw_user_meta_data->>'role', pu.role),
  phone = COALESCE(au.raw_user_meta_data->>'phone', pu.phone),
  address = COALESCE(au.raw_user_meta_data->>'address', pu.address)
FROM auth.users au
WHERE pu.id = au.id
  AND (
    au.raw_user_meta_data->>'role' IS NOT NULL 
    OR au.raw_user_meta_data->>'phone' IS NOT NULL
    OR au.raw_user_meta_data->>'address' IS NOT NULL
  );

-- Step 7: Show updated results
SELECT 
  email,
  name,
  role,
  phone,
  address,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- ============================================================================
-- OPTIONAL: Disable email confirmation (uncomment if needed)
-- ============================================================================
-- Note: Email confirmation settings are controlled in Supabase Dashboard
-- Navigate to: Authentication → Providers → Email → Toggle OFF "Confirm email"
--
-- If you need to manually confirm existing users:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- ============================================================================
-- TESTING INSTRUCTIONS
-- ============================================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Register a new user through your application
-- 3. Check the query at the bottom - new user should show '✅ SYNCED'
-- 4. Profile should appear immediately in Manajemen Pengguna
--
-- To test the trigger:
-- SELECT * FROM public.users WHERE email = 'your-test-email@example.com';
--
-- To view trigger logs:
-- Check Supabase logs for NOTICE messages about profile creation
-- ============================================================================
