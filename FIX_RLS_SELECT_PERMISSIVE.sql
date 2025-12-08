-- ============================================
-- EMERGENCY FIX: Make SELECT RLS more permissive
-- Problem: Data disappearing = RLS SELECT blocking queries
-- ============================================

-- 1. Fix users SELECT - allow authenticated to see what they need
DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_select_admin_or_self ON public.users;
DROP POLICY IF EXISTS users_select_self_or_admin ON public.users;
DROP POLICY IF EXISTS users_select_with_role_check ON public.users;

-- Simpler policy: Authenticated users can SELECT
-- - Admin/Super Admin see all
-- - Others see themselves + limited data
CREATE POLICY users_select_permissive ON public.users
FOR SELECT TO authenticated
USING (
    -- Super Admin and Admin see everything
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
        LIMIT 1000
    )
    OR
    -- Everyone else sees only themselves
    auth.uid() = id
);

-- 2. Fix settings SELECT - allow authenticated to read global settings
DROP POLICY IF EXISTS settings_select_anyone ON public.settings;
DROP POLICY IF EXISTS settings_select_all ON public.settings;

CREATE POLICY settings_select_permissive ON public.settings
FOR SELECT TO authenticated
USING (true);

-- 3. Fix forms SELECT - allow authenticated to view forms
DROP POLICY IF EXISTS forms_select_public ON public.forms;
DROP POLICY IF EXISTS forms_select_authenticated ON public.forms;

CREATE POLICY forms_select_permissive ON public.forms
FOR SELECT TO authenticated
USING (true);

-- 4. Fix orders SELECT - allow authenticated users to view their own or all if admin
DROP POLICY IF EXISTS orders_select_user_or_admin ON public.orders;

CREATE POLICY orders_select_permissive ON public.orders
FOR SELECT TO authenticated
USING (
    -- Admin/Super Admin see all
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
        LIMIT 1000
    )
    OR
    -- Others see own orders
    "assignedCsId" = auth.uid()
);

-- 5. Fix products SELECT - allow authenticated to view products
DROP POLICY IF EXISTS products_select_all ON public.products;

CREATE POLICY products_select_permissive ON public.products
FOR SELECT TO authenticated
USING (true);

-- Verify all policies created
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('users', 'settings', 'forms', 'orders', 'products')
ORDER BY tablename, policyname;
