-- RLS Linter Fixes (performance + duplicates)
-- Run in Supabase SQL Editor

-- =============================
-- SETTINGS TABLE
-- =============================
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.settings;
DROP POLICY IF EXISTS "Allow Super Admin write" ON public.settings;
DROP POLICY IF EXISTS "Allow all authenticated users to read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin to write settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can select settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can delete settings" ON public.settings;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Single read policy (authenticated)
CREATE POLICY "settings_read_auth" ON public.settings
FOR SELECT TO authenticated
USING (true);

-- Single write policy (admin only) using (select auth.uid()) per linter guidance
CREATE POLICY "settings_write_admin" ON public.settings
FOR ALL TO authenticated
USING ((select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')))
WITH CHECK ((select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')));


-- =============================
-- ANNOUNCEMENTS TABLE
-- =============================
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Super Admin and Admin can manage announcements" ON public.announcements;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_read_public" ON public.announcements
FOR SELECT TO anon, authenticated
USING ("isActive" = true);

-- Admin write (all actions) using select auth.uid()
CREATE POLICY "announcements_write_admin" ON public.announcements
FOR ALL TO authenticated
USING ((select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')))
WITH CHECK ((select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')));


-- =============================
-- BRAND SETTINGS TABLE
-- =============================
ALTER TABLE public.brand_settings DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to manage brand settings" ON public.brand_settings;

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated can manage own rows if needed; keep simple: allow admins manage all
CREATE POLICY "brand_settings_read_auth" ON public.brand_settings
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "brand_settings_write_admin" ON public.brand_settings
FOR ALL TO authenticated
USING ((select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')))
WITH CHECK ((select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')));


-- =============================
-- USERS TABLE (simplify duplicate SELECT policies)
-- =============================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_select_all_users ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS users_write_admin ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own row; admins read all
CREATE POLICY "users_read_self_or_admin" ON public.users
FOR SELECT TO authenticated
USING ( (select auth.uid()) = id OR (select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')) );

-- Single UPDATE policy: user can update self, admins can update any
CREATE POLICY "users_update_self_or_admin" ON public.users
FOR UPDATE TO authenticated
USING ( (select auth.uid()) = id OR (select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')) )
WITH CHECK ( (select auth.uid()) = id OR (select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')) );

-- INSERT/DELETE restricted to admins only
CREATE POLICY "users_insert_admin" ON public.users
FOR INSERT TO authenticated
WITH CHECK ( (select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')) );

CREATE POLICY "users_delete_admin" ON public.users
FOR DELETE TO authenticated
USING ( (select auth.uid()) IN (SELECT id FROM public.users WHERE role IN ('Super Admin','Admin')) );


-- =============================
-- VERIFICATION QUERIES
-- =============================
SELECT policyname, tablename, roles, cmd, permissive
FROM pg_policies
WHERE tablename IN ('settings','announcements','brand_settings','users')
ORDER BY tablename, policyname;

SELECT '✅ RLS policies cleaned and optimized per linter recommendations' AS status;
