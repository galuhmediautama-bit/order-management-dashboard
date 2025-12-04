-- ============================================================================
-- ALTERNATIVE SYNC - Gunakan edge function atau manual approach
-- ============================================================================
-- Problem: auth.users tidak accessible via REST API (404)
-- Solution: Disable RLS dan insert langsung dengan known data

-- Step 1: Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Delete existing
DELETE FROM public.users;

-- Step 3: Insert hardcoded known users from auth
-- GANTI dengan data sebenarnya dari auth.users yang Anda ketahui
INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
VALUES
  ('12345678-1234-1234-1234-123456789012', 'galuhmediautama@gmail.com', 'Galuh Media Utama', 'Super Admin', 'Aktif', NOW(), NOW());

-- Step 4: Check result
SELECT * FROM public.users;

-- Step 5: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
