-- ============================================
-- FIX: Allow Super Admin/Admin to insert rows into public.users
-- Issue: New user created from dashboard tidak muncul karena insert ditolak RLS
-- ============================================

-- 1) Drop existing INSERT policy if any
DROP POLICY IF EXISTS users_insert_policy ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;

-- 2) Create new INSERT policy
--    - Super Admin & Admin (berdasarkan data di tabel users) boleh insert user profile apa saja
--    - Pengguna biasa boleh insert profil dirinya sendiri (auth.uid() = id)
--    - Menggunakan auth.uid(), bukan jwt() -> 'role', agar tetap bekerja meski JWT tidak bawa custom claim
CREATE POLICY users_insert_policy ON public.users
FOR INSERT TO authenticated
WITH CHECK (
    -- admin/super admin yang sedang login
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN ('Super Admin', 'Admin')
    )
    OR
    -- user membuat profil dirinya sendiri setelah signup
    auth.uid() = id
);

-- 3) (Optional) Ensure SELECT policy allows Super Admin/Admin melihat semua user
-- Rekomendasi: Ganti SELECT policy agar Admin/Super Admin bisa lihat semua row
DROP POLICY IF EXISTS users_select_self_or_admin ON public.users;
DROP POLICY IF EXISTS users_select_with_role_check ON public.users;

CREATE POLICY users_select_admin_or_self ON public.users
FOR SELECT TO authenticated
USING (
    -- Admin/Super Admin yang sedang login boleh lihat semua baris
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN ('Super Admin', 'Admin')
    )
    OR
    -- User boleh melihat profilnya sendiri
    auth.uid() = id
);

-- 4) Verify
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Run this in Supabase SQL editor, then coba tambah user lagi dari dashboard.
