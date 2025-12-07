-- ============================================
-- SETUP ROLE PERMISSIONS TABLE
-- Run this script in Supabase SQL Editor
-- ============================================

-- Step 1: Create settings table if not exists
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 1.5: Add columns if they don't exist (for existing tables)
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS role_permissions JSONB;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS website_settings JSONB;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tracking_settings JSONB;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS message_templates JSONB;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS cancellation_reasons JSONB;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS announcement_settings JSONB;

-- Step 2: Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if any
DROP POLICY IF EXISTS "Allow all authenticated users to read settings" ON public.settings;
DROP POLICY IF EXISTS "Only Super Admin can modify settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.settings;
DROP POLICY IF EXISTS "Allow Super Admin write" ON public.settings;

-- Step 4: Create new policies
-- Allow everyone to read settings (needed for role permissions)
CREATE POLICY "Allow authenticated read" ON public.settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow Super Admin and Admin to modify settings
CREATE POLICY "Allow Super Admin write" ON public.settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
        AND (role = 'Super Admin' OR role = 'Admin')
    )
);

-- Step 5: Insert or update rolePermissions entry with default permissions
INSERT INTO public.settings (id, role_permissions)
VALUES (
    'rolePermissions',
    '{
        "Super Admin": {
            "menus": ["dashboard", "products", "product_list", "form_list", "orders", "order_list", "abandoned_carts", "customers", "reports", "ad_reports", "cs_reports", "earnings", "settings", "website_settings", "user_management", "role_management", "brands", "cs_management", "tracking", "announcements", "deletion_requests", "cuan_rank"],
            "features": ["export_csv", "edit_form", "delete_order", "change_order_status", "view_earnings", "manage_users", "manage_roles", "view_reports", "edit_settings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_charts", "view_top_products", "view_top_advertisers", "view_top_cs", "view_recent_orders"],
            "updatedAt": "2025-12-07T00:00:00.000Z"
        },
        "Admin": {
            "menus": ["dashboard", "products", "product_list", "form_list", "orders", "order_list", "abandoned_carts", "customers", "reports", "ad_reports", "cs_reports", "earnings", "settings", "website_settings", "user_management", "brands", "cs_management", "tracking", "announcements"],
            "features": ["export_csv", "edit_form", "delete_order", "change_order_status", "view_earnings", "manage_users", "view_reports", "edit_settings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_charts", "view_top_products", "view_top_advertisers", "view_top_cs", "view_recent_orders"],
            "updatedAt": "2025-12-07T00:00:00.000Z"
        },
        "Keuangan": {
            "menus": ["dashboard", "orders", "order_list", "customers", "reports", "cs_reports", "earnings"],
            "features": ["export_csv", "view_earnings", "view_reports", "view_sales_stats", "view_charts", "view_top_cs", "view_recent_orders"],
            "updatedAt": "2025-12-07T00:00:00.000Z"
        },
        "Customer service": {
            "menus": ["dashboard", "orders", "order_list", "abandoned_carts", "customers", "earnings"],
            "features": ["export_csv", "change_order_status", "view_earnings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_recent_orders"],
            "updatedAt": "2025-12-07T00:00:00.000Z"
        },
        "Gudang": {
            "menus": ["dashboard", "orders", "order_list"],
            "features": ["change_order_status", "sound_notifications", "view_recent_orders"],
            "updatedAt": "2025-12-07T00:00:00.000Z"
        },
        "Advertiser": {
            "menus": ["dashboard", "products", "product_list", "form_list", "reports", "ad_reports", "earnings"],
            "features": ["export_csv", "edit_form", "view_earnings", "sound_notifications", "view_sales_stats", "view_charts", "view_top_products"],
            "updatedAt": "2025-12-07T00:00:00.000Z"
        },
        "Partner": {
            "menus": ["dashboard", "reports", "ad_reports"],
            "features": ["view_reports", "view_sales_stats", "view_charts"],
            "updatedAt": "2025-12-07T00:00:00.000Z"
        }
    }'::jsonb
)
ON CONFLICT (id) 
DO UPDATE SET 
    role_permissions = EXCLUDED.role_permissions;

-- Step 6: Verify the setup
SELECT 
    id,
    role_permissions,
    created_at
FROM public.settings
WHERE id = 'rolePermissions';

-- Step 7: Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'settings';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Role permissions table setup complete!';
    RAISE NOTICE '✅ Default permissions inserted for all roles';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Refresh your dashboard page';
    RAISE NOTICE '2. Go to Pengaturan → Manajemen Peran';
    RAISE NOTICE '3. Click "Kelola Menu & Fitur" on any role';
    RAISE NOTICE '4. Check/uncheck permissions and click Save';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 To verify: SELECT * FROM settings WHERE id = ''rolePermissions'';';
END $$;
