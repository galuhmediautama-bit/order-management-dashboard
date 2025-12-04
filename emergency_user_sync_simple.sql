-- ============================================================================
-- EMERGENCY USER SYNC - SIMPLE VERSION
-- Jalankan ini kalau SQL Editor slow/loading
-- ============================================================================

-- STEP 1: Disable RLS untuk allow INSERT
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Delete all users
DELETE FROM public.users;

-- STEP 3: Insert semua dari auth.users
INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)),
  CASE WHEN au.email = 'galuhmediautama@gmail.com' THEN 'Super Admin' ELSE COALESCE(au.raw_user_meta_data->>'role', 'Advertiser') END,
  'Aktif',
  au.created_at,
  NOW()
FROM auth.users au;

-- STEP 4: Confirm emails
UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()) WHERE email_confirmed_at IS NULL;

-- STEP 5: Enable RLS kembali
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Show result
SELECT COUNT(*) as total_users FROM public.users;
SELECT * FROM public.users ORDER BY created_at DESC;
