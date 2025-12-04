-- ============================================================================
-- FIX FOREIGN KEY + FORCE SYNC
-- ============================================================================

-- Step 1: Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- Step 3: Check foreign keys
SELECT constraint_name, table_name, column_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'users';

-- Step 4: Drop foreign key if exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS "users_id_fkey";

-- Step 5: Delete existing
DELETE FROM public.users;

-- Step 6: Insert all users (minimal columns only)
INSERT INTO public.users (id, email, name, role, status, created_at)
VALUES
  ('f5826301-b41a-43ea-a31a-d18d8db3c3c2', 'galuhmediautama@gmail.com', 'Alan Maulana', 'Super Admin', 'Aktif', '2025-12-01 11:15:37.225770+00'),
  ('2ea52886-badf-43e1-814a-89078ee43851', 'sjamsaja@gmail.com', 'sjamsaja', 'Advertiser', 'Aktif', '2025-12-02 16:16:36.189650+00'),
  ('a75cc528-70bc-4bab-b591-54da55c1249b', 'arsusanto989@gmail.com', 'Ari Susanto', 'Advertiser', 'Aktif', '2025-12-04 03:45:46.231776+00'),
  ('d2c1eb87-9242-4bce-bd86-a8b4e8c7eff7', 'syahrulwandika@gmail.com', 'Syahrul wandika', 'Advertiser', 'Aktif', '2025-12-04 03:53:07.648616+00'),
  ('ef3d9af3-cc5a-48eb-b34f-569a9be4c618', 'louipradafauziah@gmail.com', 'Loui Prada Fauziah', 'Advertiser', 'Aktif', '2025-12-04 03:55:36.794129+00'),
  ('df877fce-e8b5-499d-a282-a976008c5683', 'perfumeamorenza@gmail.com', 'Ezwin', 'Advertiser', 'Aktif', '2025-12-04 12:32:11.524187+00');

-- Step 7: Verify
SELECT COUNT(*) as total_users FROM public.users;
SELECT id, email, name, role, status FROM public.users ORDER BY created_at;
