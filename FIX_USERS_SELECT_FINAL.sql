-- ============================================
-- FIX: Users SELECT RLS Policy - Admin dapat lihat semua user
-- ============================================

-- Drop policy lama yang membatasi
DROP POLICY IF EXISTS users_select_admin_or_self ON public.users;
DROP POLICY IF EXISTS users_select_self_or_admin ON public.users;
DROP POLICY IF EXISTS users_select_with_role_check ON public.users;

-- Buat policy baru yang proper:
-- 1. Admin/Super Admin (dari tabel users) bisa lihat semua row
-- 2. User biasa hanya lihat dirinya sendiri
CREATE POLICY users_select_policy ON public.users
FOR SELECT TO authenticated
USING (
    -- Admin/Super Admin yang sedang login bisa lihat semua user
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN ('Super Admin', 'Admin')
        AND u.status = 'Aktif'
    )
    OR
    -- User biasa hanya lihat profilnya sendiri
    auth.uid() = id
);

-- Verify policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
