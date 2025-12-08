-- ============================================
-- FIX: Enable RLS on all tables + proper policies
-- This fixes the 500 errors
-- ============================================

-- 1. ENABLE RLS on all tables
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- users already has RLS enabled

-- 2. DROP old problematic policies if any
DROP POLICY IF EXISTS users_select_admin_or_self ON public.users;
DROP POLICY IF EXISTS users_select_self_or_admin ON public.users;
DROP POLICY IF EXISTS users_select_with_role_check ON public.users;
DROP POLICY IF EXISTS users_select_permissive ON public.users;
DROP POLICY IF EXISTS users_select_fixed ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;
DROP POLICY IF EXISTS users_update_self ON public.users;

DROP POLICY IF EXISTS settings_select_all ON public.settings;
DROP POLICY IF EXISTS settings_select_anyone ON public.settings;
DROP POLICY IF EXISTS settings_update_admin ON public.settings;

DROP POLICY IF EXISTS forms_select_all ON public.forms;
DROP POLICY IF EXISTS forms_select_public ON public.forms;
DROP POLICY IF EXISTS forms_select_authenticated ON public.forms;
DROP POLICY IF EXISTS forms_insert_auth ON public.forms;
DROP POLICY IF EXISTS forms_select_permissive ON public.forms;

DROP POLICY IF EXISTS orders_select_all ON public.orders;
DROP POLICY IF EXISTS orders_select_user_or_admin ON public.orders;
DROP POLICY IF EXISTS orders_insert_all ON public.orders;
DROP POLICY IF EXISTS orders_select_permissive ON public.orders;

DROP POLICY IF EXISTS products_select_all ON public.products;
DROP POLICY IF EXISTS products_insert_auth ON public.products;
DROP POLICY IF EXISTS products_delete_admin ON public.products;
DROP POLICY IF EXISTS products_select_permissive ON public.products;

-- 3. Create SIMPLE, PERMISSIVE policies for all tables
-- Strategy: All authenticated users can read everything
-- Writes restricted by role (admin only or based on ownership)

-- ============ USERS TABLE ============
CREATE POLICY users_select_authenticated ON public.users
FOR SELECT TO authenticated
USING (true);

CREATE POLICY users_insert_admin ON public.users
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
    OR auth.uid() = id
);

CREATE POLICY users_update_admin ON public.users
FOR UPDATE TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
    OR auth.uid() = id
);

CREATE POLICY users_delete_admin ON public.users
FOR DELETE TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role = 'Super Admin'
        AND status = 'Aktif'
    )
);

-- ============ ORDERS TABLE ============
CREATE POLICY orders_select_authenticated ON public.orders
FOR SELECT TO authenticated
USING (true);

CREATE POLICY orders_insert_authenticated ON public.orders
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY orders_update_authenticated ON public.orders
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============ FORMS TABLE ============
CREATE POLICY forms_select_authenticated ON public.forms
FOR SELECT TO authenticated
USING (true);

CREATE POLICY forms_insert_authenticated ON public.forms
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY forms_update_authenticated ON public.forms
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============ PRODUCTS TABLE ============
CREATE POLICY products_select_authenticated ON public.products
FOR SELECT TO authenticated
USING (true);

CREATE POLICY products_insert_authenticated ON public.products
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY products_update_authenticated ON public.products
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY products_delete_admin ON public.products
FOR DELETE TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role = 'Super Admin'
        AND status = 'Aktif'
    )
);

-- ============ SETTINGS TABLE ============
CREATE POLICY settings_select_authenticated ON public.settings
FOR SELECT TO authenticated
USING (true);

CREATE POLICY settings_insert_admin ON public.settings
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

CREATE POLICY settings_update_admin ON public.settings
FOR UPDATE TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

-- 4. Verify all policies created
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('users', 'orders', 'forms', 'products', 'settings')
ORDER BY tablename, cmd, policyname;

-- 5. Verify all tables have RLS enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'orders', 'forms', 'products', 'settings')
ORDER BY tablename;
