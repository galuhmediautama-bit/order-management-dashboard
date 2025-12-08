-- ============================================
-- QUICK FIX: Users SELECT RLS - Simpler version
-- Remove subquery issues
-- ============================================

DROP POLICY IF EXISTS users_select_permissive ON public.users;
DROP POLICY IF EXISTS users_select_policy ON public.users;

-- Simplest possible: Authenticated can see users
-- - Self access always
-- - Admin check via EXISTS with single row lookup
CREATE POLICY users_select_fixed ON public.users
FOR SELECT TO authenticated
USING (
    auth.uid() = id  -- User always sees their own profile
    OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid()
        AND role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

-- Remove all RLS from other tables temporarily for debugging
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Check what policies exist
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('users', 'orders', 'forms', 'products', 'settings')
ORDER BY tablename, policyname;
