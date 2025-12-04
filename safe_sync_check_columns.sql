-- ============================================================================
-- SAFE SYNC - Cek kolom dulu baru insert
-- ============================================================================

-- STEP 1: Check actual columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- STEP 2: Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 3: Delete existing data
DELETE FROM public.users;

-- STEP 4: Insert hanya dengan kolom yang PASTI ada (id, email)
-- Adjust sesuai hasil dari Step 1
INSERT INTO public.users (id, email)
VALUES ('test-uuid-1', 'galuhmediautama@gmail.com');

-- STEP 5: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Show result
SELECT * FROM public.users;
