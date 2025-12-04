-- ============================================================================
-- DEBUG USER SYNC ISSUE - Comprehensive Diagnostics
-- ============================================================================
-- Check SEMUA aspek yang mungkin blokir user sync
-- ============================================================================

-- 1. CHECK AUTH USERS
SELECT '=== 1. AUTH USERS ===' as step;
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- 2. CHECK PUBLIC USERS
SELECT '=== 2. PUBLIC USERS ===' as step;
SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. CHECK TABLE STRUCTURE
SELECT '=== 3. TABLE COLUMNS ===' as step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. CHECK RLS POLICIES ON USERS TABLE
SELECT '=== 4. RLS POLICIES ===' as step;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 5. CHECK IF RLS IS ENABLED
SELECT '=== 5. RLS STATUS ===' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 6. CHECK TRIGGER
SELECT '=== 6. TRIGGER HANDLE_NEW_USER ===' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users';

-- 7. CHECK FUNCTION handle_new_user
SELECT '=== 7. FUNCTION HANDLE_NEW_USER ===' as step;
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  proconfig as search_path_config
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 8. TEST INSERT DIRECTLY (BYPASS RLS)
SELECT '=== 8. TEST DIRECT INSERT ===' as step;
-- Disable RLS temporarily untuk test
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Try insert 1 missing user
DO $$
DECLARE
  test_user_id uuid;
  test_email text;
BEGIN
  -- Get first auth user that doesn't exist in public.users
  SELECT au.id, au.email INTO test_user_id, test_email
  FROM auth.users au
  LEFT JOIN public.users pu ON pu.id = au.id
  WHERE pu.id IS NULL
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      test_email,
      SPLIT_PART(test_email, '@', 1),
      'Advertiser',
      'Aktif',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Test insert SUCCESS for: %', test_email;
  ELSE
    RAISE NOTICE 'No missing users found';
  END IF;
END $$;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 9. CHECK RESULT AFTER TEST INSERT
SELECT '=== 9. USERS AFTER TEST INSERT ===' as step;
SELECT 
  id,
  email,
  name,
  role,
  status
FROM public.users
ORDER BY created_at DESC;

-- 10. FINAL SUMMARY
SELECT '=== 10. FINAL SUMMARY ===' as step;
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth,
  (SELECT COUNT(*) FROM public.users) as total_public,
  (SELECT COUNT(*) 
   FROM auth.users au 
   LEFT JOIN public.users pu ON pu.id = au.id 
   WHERE pu.id IS NULL) as missing,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users)
    THEN '✅ SYNC'
    ELSE '❌ TIDAK SYNC - RLS ATAU CONSTRAINT ISSUE'
  END as diagnosis;

-- 11. CHECK FOREIGN KEY CONSTRAINTS
SELECT '=== 11. FOREIGN KEY CONSTRAINTS ===' as step;
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'users';

-- ============================================================================
-- HASIL YANG DIHARAPKAN:
-- ============================================================================
-- Step 8: Test insert berhasil (RLS disabled sementara)
-- Step 9: User baru muncul di public.users
-- Step 10: Diagnosis menunjuk ke RLS atau constraint issue jika masih gagal
-- ============================================================================
