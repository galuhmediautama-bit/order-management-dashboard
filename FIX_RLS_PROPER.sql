-- ============================================
-- PROPER RLS FIX: Enable RLS with correct policies
-- After disabling, re-enable with working logic
-- ============================================

-- 1. Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ============ USERS TABLE ============
-- Users can see themselves OR if they're admin, see everyone
DROP POLICY IF EXISTS users_select_fixed ON public.users;
CREATE POLICY users_select_all ON public.users
FOR SELECT TO authenticated
USING (
    -- Always see your own profile
    auth.uid() = id
    OR
    -- Admins see everyone (check current user's role)
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

-- Users can insert themselves
DROP POLICY IF EXISTS users_insert_self ON public.users;
CREATE POLICY users_insert_self ON public.users
FOR INSERT TO authenticated
WITH CHECK (
    -- Self insert
    auth.uid() = id
    OR
    -- Admin insert anyone
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

-- Users can update their own profile
DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
FOR UPDATE TO authenticated
USING (
    auth.uid() = id
    OR
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

-- ============ SETTINGS TABLE ============
-- All authenticated users can read settings (needed for global config)
DROP POLICY IF EXISTS settings_select_all ON public.settings;
CREATE POLICY settings_select_all ON public.settings
FOR SELECT TO authenticated
USING (true);

-- Only admins can update settings
DROP POLICY IF EXISTS settings_update_admin ON public.settings;
CREATE POLICY settings_update_admin ON public.settings
FOR UPDATE TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

-- ============ FORMS TABLE ============
-- All authenticated users can view all forms
DROP POLICY IF EXISTS forms_select_all ON public.forms;
CREATE POLICY forms_select_all ON public.forms
FOR SELECT TO authenticated
USING (true);

-- Only admins and form owner can insert
DROP POLICY IF EXISTS forms_insert_auth ON public.forms;
CREATE POLICY forms_insert_auth ON public.forms
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
);

-- ============ PRODUCTS TABLE ============
-- All authenticated users can view all products
DROP POLICY IF EXISTS products_select_all ON public.products;
CREATE POLICY products_select_all ON public.products
FOR SELECT TO authenticated
USING (true);

-- Admin/Advertiser can insert
DROP POLICY IF EXISTS products_insert_auth ON public.products;
CREATE POLICY products_insert_auth ON public.products
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin', 'Advertiser')
        AND status = 'Aktif'
    )
);

-- Admin can delete, others update only own
DROP POLICY IF EXISTS products_delete_admin ON public.products;
CREATE POLICY products_delete_admin ON public.products
FOR DELETE TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role = 'Super Admin'
        AND status = 'Aktif'
    )
);

-- ============ ORDERS TABLE ============
-- Admin can see all, others see own
DROP POLICY IF EXISTS orders_select_all ON public.orders;
CREATE POLICY orders_select_all ON public.orders
FOR SELECT TO authenticated
USING (
    -- Admins see all
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE role IN ('Super Admin', 'Admin')
        AND status = 'Aktif'
    )
    OR
    -- User sees own orders (assigned CS)
    "assignedCsId" = auth.uid()
);

-- Anyone can insert orders
DROP POLICY IF EXISTS orders_insert_all ON public.orders;
CREATE POLICY orders_insert_all ON public.orders
FOR INSERT TO authenticated
WITH CHECK (true);

-- Verify all policies
SELECT tablename, policyname, cmd, roles, qual IS NOT NULL as has_using
FROM pg_policies
WHERE tablename IN ('users', 'orders', 'forms', 'products', 'settings')
ORDER BY tablename, cmd, policyname;
