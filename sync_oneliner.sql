-- ============================================================================
-- ABSOLUTE MINIMAL - 1 Query saja
-- ============================================================================
-- Copy HANYA line ini ke SQL Editor:

DELETE FROM public.users; INSERT INTO public.users (id, email, name, role, status, created_at, updated_at) SELECT au.id, au.email, SPLIT_PART(au.email, '@', 1), CASE WHEN au.email = 'galuhmediautama@gmail.com' THEN 'Super Admin' ELSE 'Advertiser' END, 'Aktif', au.created_at, NOW() FROM auth.users au;
