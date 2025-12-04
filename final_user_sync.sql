-- ============================================================================
-- FINAL USER SYNC - Dengan kolom yang BENAR
-- ============================================================================

-- Step 1: Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Delete all
DELETE FROM public.users;

-- Step 3: Insert dengan kolom yang ada - Data dari auth.users
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  status,
  avatar,
  lastLogin,
  baseSalary,
  assignedBrandIds,
  created_at,
  phone,
  address
)
VALUES
  ('f5826301-b41a-43ea-a31a-d18d8db3c3c2', 'galuhmediautama@gmail.com', 'Alan Maulana', 'Super Admin', 'Aktif', '', NOW(), 0, NULL, '2025-12-01 11:15:37.225770+00', '', ''),
  ('2ea52886-badf-43e1-814a-89078ee43851', 'sjamsaja@gmail.com', 'sjamsaja', 'Advertiser', 'Aktif', '', NOW(), 0, NULL, '2025-12-02 16:16:36.189650+00', '', ''),
  ('a75cc528-70bc-4bab-b591-54da55c1249b', 'arsusanto989@gmail.com', 'Ari Susanto', 'Advertiser', 'Aktif', '', NOW(), 0, NULL, '2025-12-04 03:45:46.231776+00', '', ''),
  ('d2c1eb87-9242-4bce-bd86-a8b4e8c7eff7', 'syahrulwandika@gmail.com', 'Syahrul wandika', 'Advertiser', 'Aktif', '', NOW(), 0, NULL, '2025-12-04 03:53:07.648616+00', '', ''),
  ('ef3d9af3-cc5a-48eb-b34f-569a9be4c618', 'louipradafauziah@gmail.com', 'Loui Prada Fauziah', 'Advertiser', 'Aktif', '', NOW(), 0, NULL, '2025-12-04 03:55:36.794129+00', '', ''),
  ('df877fce-e8b5-499d-a282-a976008c5683', 'perfumeamorenza@gmail.com', 'Ezwin', 'Advertiser', 'Aktif', '', NOW(), 0, NULL, '2025-12-04 12:32:11.524187+00', '', '');

-- Step 4: Enable RLS kembali
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify
SELECT id, email, name, role, status FROM public.users ORDER BY created_at;
