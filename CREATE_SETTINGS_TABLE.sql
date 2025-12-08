-- ============================================
-- SETUP ROLE PERMISSIONS TABLE
-- Run this script in Supabase SQL Editor
-- ============================================

-- Step 1: Create settings table if not exists
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    role_permissions JSONB,
    website_settings JSONB,
    tracking_settings JSONB,
    message_templates JSONB,
    cancellation_reasons JSONB,
    announcement_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Step 5: Insert default rolePermissions entry
INSERT INTO public.settings (id, role_permissions, updated_at)
VALUES (
    'rolePermissions',
    '{
        "Super Admin": {
            "menus": ["dashboard", "products", "product_list", "form_list", "orders", "order_list", "abandoned_carts", "customers", "reports", "ad_reports", "cs_reports", "earnings", "settings", "website_settings", "user_management", "role_management", "brands", "cs_management", "tracking", "announcements", "deletion_requests", "cuan_rank"],
            "features": ["export_csv", "edit_form", "delete_order", "change_order_status", "view_earnings", "manage_users", "manage_roles", "view_reports", "edit_settings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_charts", "view_top_products", "view_top_advertisers", "view_top_cs", "view_recent_orders"]
        },
        "Admin": {
            "menus": ["dashboard", "products", "product_list", "form_list", "orders", "order_list", "abandoned_carts", "customers", "reports", "ad_reports", "cs_reports", "earnings", "settings", "website_settings", "user_management", "role_management", "brands", "cs_management", "tracking", "announcements"],
            "features": ["export_csv", "edit_form", "delete_order", "change_order_status", "view_earnings", "manage_users", "manage_roles", "view_reports", "edit_settings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_charts", "view_top_products", "view_top_advertisers", "view_top_cs", "view_recent_orders"]
        },
        "Advertiser": {
            "menus": ["dashboard", "products", "product_list", "form_list", "reports", "ad_reports", "earnings"],
            "features": ["export_csv", "edit_form", "view_earnings", "sound_notifications", "view_sales_stats", "view_charts", "view_top_products"]
        }
    }'::jsonb,
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role_permissions = EXCLUDED.role_permissions,
    updated_at = NOW();

-- Verify table created
SELECT * FROM public.settings WHERE id = 'rolePermissions';
