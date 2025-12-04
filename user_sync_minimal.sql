-- ============================================================================
-- SUPER MINIMAL USER SYNC - Copy paste ini ke SQL Editor
-- ============================================================================
-- JANGAN ada yang di-comment, jalankan langsung saja

-- DISABLE RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- DELETE ALL
DELETE FROM public.users;

-- INSERT ALL FROM AUTH (without brand_id - column doesn't exist)
INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)), CASE WHEN au.email = 'galuhmediautama@gmail.com' THEN 'Super Admin' ELSE 'Advertiser' END, 'Aktif', au.created_at, NOW()
FROM auth.users au;

-- ENABLE RLS KEMBALI
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- CEK HASILNYA
SELECT COUNT(*) as total FROM public.users;
