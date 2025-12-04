-- Cleanup: Remove old duplicate policies for SELECT action
-- Keep only the consolidated policies

-- abandoned_carts: Keep only carts_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Enable all access abandoned_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.abandoned_carts;

-- ad_reports: Keep only ad_reports_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full ad_reports" ON public.ad_reports;
DROP POLICY IF EXISTS "Enable all access" ON public.ad_reports;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.ad_reports;

-- brands: Keep only brands_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full brands" ON public.brands;
DROP POLICY IF EXISTS "Enable all access brands" ON public.brands;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.brands;
DROP POLICY IF EXISTS "Public read brands" ON public.brands;

-- cs_agents: Keep only cs_agents_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full cs_agents" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable all access" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable all access cs_agents" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cs_agents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.cs_agents;

-- forms: Keep only forms_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full forms" ON public.forms;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.forms;
DROP POLICY IF EXISTS "Enable all access forms" ON public.forms;
DROP POLICY IF EXISTS "Public read forms" ON public.forms;

-- notifications: Keep only notifications_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable all access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for all users" ON public.notifications;

-- orders: Keep only orders_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full orders" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable all access orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;

-- settings: Keep only settings_allow_all_access for SELECT
DROP POLICY IF EXISTS "Auth full settings" ON public.settings;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.settings;
DROP POLICY IF EXISTS "Enable all access settings" ON public.settings;

-- users: Keep only users_allow_all_select for SELECT
DROP POLICY IF EXISTS "Enable all for users" ON public.users;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable all access users" ON public.users;

-- ============================================================================
-- Verify remaining policies (should only have consolidated ones)
-- ============================================================================
-- SELECT tablename, policyname, qual, with_check, permissive
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('users', 'orders', 'forms', 'brands', 'abandoned_carts', 
--                   'ad_reports', 'cs_agents', 'settings', 'notifications')
-- ORDER BY tablename, policyname;
