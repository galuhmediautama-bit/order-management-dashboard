-- ============================================================================
-- FORCE SYNC ALL USERS - Super Emergency Fix
-- ============================================================================
-- Paksa sync SEMUA user dari auth.users ke public.users
-- Ini akan MENGHAPUS semua profile lama dan buat ulang dari auth.users
-- ============================================================================

-- Step 1: DIAGNOSTIC - Show ALL auth.users with details
SELECT 
  '📋 SEMUA AUTH USERS:' as info,
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  au.raw_user_meta_data
FROM auth.users au
ORDER BY au.created_at DESC;

-- Step 2: Show current public.users
SELECT 
  '👥 PUBLIC USERS SEKARANG:' as info,
  id,
  email,
  name,
  role,
  status
FROM public.users
ORDER BY created_at DESC;

-- Step 3: DELETE semua users di public.users (RESET TOTAL)
-- HATI-HATI: Ini akan hapus semua user profiles!
DELETE FROM public.users WHERE id IS NOT NULL;

-- Step 4: Show empty state
SELECT 
  '🗑️ SETELAH DIHAPUS:' as info,
  COUNT(*) as remaining_users
FROM public.users;

-- Step 5: INSERT ULANG SEMUA users dari auth.users
-- Ini akan buat profile untuk SEMUA user tanpa exception
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  status,
  phone,
  address,
  brand_id,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as name,
  CASE 
    WHEN au.email = 'galuhmediautama@gmail.com' THEN 'Super Admin'
    WHEN au.raw_user_meta_data->>'role' IS NOT NULL 
         AND au.raw_user_meta_data->>'role' != '' 
    THEN au.raw_user_meta_data->>'role'
    ELSE 'Advertiser'
  END as role,
  'Aktif' as status,  -- Semua langsung aktif
  au.raw_user_meta_data->>'phone' as phone,
  au.raw_user_meta_data->>'address' as address,
  NULL as brand_id,  -- Set NULL dulu, nanti bisa diatur manual
  au.created_at,
  NOW() as updated_at
FROM auth.users au;

-- Step 6: Confirm ALL emails automatically
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Step 7: HASIL AKHIR - Show ALL users
SELECT 
  '✅ HASIL AKHIR - SEMUA USERS:' as info,
  pu.id,
  pu.email,
  pu.name,
  pu.role,
  pu.status,
  au.email_confirmed_at,
  'SUKSES' as sync_status
FROM public.users pu
JOIN auth.users au ON au.id = pu.id
ORDER BY pu.created_at DESC;

-- Step 8: SUMMARY
SELECT 
  '📊 SUMMARY:' as info,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users pu ON pu.id = au.id WHERE pu.id IS NULL) as masih_hilang,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users) 
    THEN '✅ SEMUA SYNC!'
    ELSE '❌ MASIH ADA YANG HILANG'
  END as status_sync;

-- ============================================================================
-- HASIL YANG HARUS DICAPAI:
-- ============================================================================
-- ✅ total_auth_users = total_public_users (harusnya 6 = 6)
-- ✅ masih_hilang = 0
-- ✅ status_sync = '✅ SEMUA SYNC!'
-- ============================================================================

-- BONUS: List semua user dengan lengkap
SELECT 
  email,
  name,
  role,
  status,
  brand_id,
  created_at
FROM public.users
ORDER BY created_at DESC;
