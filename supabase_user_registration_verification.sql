-- =============================================================================
-- USER REGISTRATION ROLE FIX - VERIFICATION & DEBUGGING QUERIES
-- =============================================================================
-- Use these queries to verify the fix is working and debug any issues
-- =============================================================================

-- ============================================================================
-- QUERY 1: Find All Users and Their Roles
-- ============================================================================
SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at,
  CASE 
    WHEN role = 'Super Admin' AND status = 'Tidak Aktif' THEN '⚠️ Suspicious: New user but Super Admin'
    WHEN role IS NULL THEN '❌ Error: No role assigned'
    WHEN status = 'Tidak Aktif' THEN '⏳ Pending approval'
    WHEN status = 'Aktif' THEN '✅ Active'
    ELSE '❓ Unknown status'
  END as status_check
FROM public.users
ORDER BY created_at DESC;

-- ============================================================================
-- QUERY 2: Check for Users Missing from public.users table
-- ============================================================================
-- These users can login to auth but won't have a profile in the app
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  pu.id as profile_exists,
  'MISSING PROFILE' as issue
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- ============================================================================
-- QUERY 3: Check for Duplicate or Corrupted User Profiles
-- ============================================================================
SELECT 
  email,
  COUNT(*) as duplicate_count,
  STRING_AGG(DISTINCT role, ', ') as roles,
  STRING_AGG(DISTINCT status, ', ') as statuses,
  STRING_AGG(DISTINCT id::text, ', ') as user_ids
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================================================
-- QUERY 4: Verify RLS Policies Are Correctly Set
-- ============================================================================
SELECT 
  tablename,
  policyname,
  permissive,
  qual,
  with_check,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- QUERY 5: Specific User Role Verification
-- ============================================================================
-- Run this query after replacing 'USER_EMAIL_HERE' with actual email
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.status,
  u.created_at,
  au.email as auth_email,
  au.created_at as auth_created_at,
  au.confirmed_at,
  CASE 
    WHEN au.email IS NULL THEN '❌ Not in auth.users - PROBLEM!'
    WHEN u.role IS NULL THEN '❌ No role - might be old profile'
    WHEN u.role = 'Super Admin' AND u.status = 'Tidak Aktif' THEN '⚠️ Check if this is legitimate'
    WHEN u.status = 'Tidak Aktif' THEN '⏳ Waiting for admin approval'
    WHEN u.status = 'Aktif' THEN '✅ Can login normally'
    ELSE '❓ Unknown'
  END as diagnosis
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE LOWER(u.email) = LOWER('USER_EMAIL_HERE');

-- ============================================================================
-- QUERY 6: Check User Role Distribution
-- ============================================================================
SELECT 
  role,
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM public.users
GROUP BY role, status
ORDER BY count DESC;

-- ============================================================================
-- QUERY 7: Find Recently Created Users (Last 24 Hours)
-- ============================================================================
SELECT 
  id,
  email,
  role,
  status,
  created_at,
  NOW() - created_at as age,
  CASE
    WHEN role IS NULL THEN '❌ Role is NULL'
    WHEN role = 'Super Admin' AND status = 'Tidak Aktif' THEN '⚠️ New user but Super Admin'
    ELSE '✅ OK: ' || role
  END as check
FROM public.users
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- ============================================================================
-- QUERY 8: Verify RLS Allows Self-Read
-- ============================================================================
-- This query checks if the "Users can read own profile" policy exists
SELECT 
  policyname,
  tablename,
  qual as policy_condition,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'users' 
  AND policyname LIKE '%own%'
  AND schemaname = 'public';

-- ============================================================================
-- MANUAL FIX: Update User Role (if needed)
-- ============================================================================
-- Uncomment and modify the email to fix a specific user
-- UPDATE public.users 
-- SET role = 'Customer service'
-- WHERE LOWER(email) = LOWER('user@example.com');

-- ============================================================================
-- MANUAL FIX: Create Missing Profile
-- ============================================================================
-- If a user exists in auth.users but not in public.users
-- INSERT INTO public.users (id, email, name, role, status)
-- SELECT 
--   id, 
--   email, 
--   email as name,
--   'Admin',  -- Change this to correct role
--   'Tidak Aktif'
-- FROM auth.users 
-- WHERE email = 'user@example.com'
-- AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);

-- ============================================================================
-- DIAGNOSTIC: Check for Profile Creation Trigger
-- ============================================================================
SELECT 
  trigger_schema,
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'users'
ORDER BY trigger_name;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================
-- Run all at once to get a health report

WITH user_counts AS (
  SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
  FROM public.users
  
  UNION ALL
  SELECT 
    'Super Admin Users',
    COUNT(*)::text
  FROM public.users
  WHERE role = 'Super Admin'
  
  UNION ALL
  SELECT 
    'Inactive Super Admin (suspicious)',
    COUNT(*)::text
  FROM public.users
  WHERE role = 'Super Admin' AND status = 'Tidak Aktif'
  
  UNION ALL
  SELECT 
    'Missing Role (NULL)',
    COUNT(*)::text
  FROM public.users
  WHERE role IS NULL
  
  UNION ALL
  SELECT 
    'Auth users without profile',
    COUNT(*)::text
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
  
  UNION ALL
  SELECT 
    'Duplicate email profiles',
    COUNT(DISTINCT email)::text
  FROM (
    SELECT email FROM public.users
    GROUP BY email HAVING COUNT(*) > 1
  ) dupes
)
SELECT metric, value FROM user_counts
ORDER BY metric;

-- ============================================================================
-- NOTES FOR DEBUGGING
-- ============================================================================
-- 1. If "Inactive Super Admin (suspicious)" count is high → users are getting wrong role
-- 2. If "Missing Role (NULL)" count > 0 → profile creation issue
-- 3. If "Auth users without profile" count > 0 → profile insertion failing silently
-- 4. If "Duplicate email profiles" count > 0 → data integrity issue, needs cleanup
--
-- For each issue, use the queries above to find affected users and fix manually
