-- ============================================
-- FIX: Add missing 'user_management' menu to Admin role
-- This script updates the existing role_permissions in the settings table
-- Run this in Supabase SQL Editor if your database was already initialized
-- ============================================

-- Fix Admin role permissions by adding 'role_management' and 'user_management' to menus
UPDATE public.settings
SET role_permissions = jsonb_set(
    role_permissions,
    '{Admin,menus}',
    jsonb_build_array(
        'dashboard',
        'products',
        'product_list',
        'form_list',
        'orders',
        'order_list',
        'abandoned_carts',
        'customers',
        'reports',
        'ad_reports',
        'cs_reports',
        'earnings',
        'settings',
        'website_settings',
        'user_management',
        'role_management',
        'brands',
        'cs_management',
        'tracking',
        'announcements'
    )::jsonb
),
    updated_at = NOW()
WHERE id = 'rolePermissions'
  AND NOT (role_permissions->'Admin'->'menus' @> '"role_management"'::jsonb);

-- Also update features to include manage_roles for Admin
UPDATE public.settings
SET role_permissions = jsonb_set(
    role_permissions,
    '{Admin,features}',
    jsonb_build_array(
        'export_csv',
        'edit_form',
        'delete_order',
        'change_order_status',
        'view_earnings',
        'manage_users',
        'manage_roles',
        'view_reports',
        'edit_settings',
        'sound_notifications',
        'manual_order_creation',
        'view_sales_stats',
        'view_charts',
        'view_top_products',
        'view_top_advertisers',
        'view_top_cs',
        'view_recent_orders'
    )::jsonb
),
    updated_at = NOW()
WHERE id = 'rolePermissions'
  AND NOT (role_permissions->'Admin'->'features' @> '"manage_roles"'::jsonb);

-- Verify the update
SELECT 
    id,
    role_permissions->'Admin'->'menus' as admin_menus,
    role_permissions->'Admin'->'features' as admin_features
FROM public.settings
WHERE id = 'rolePermissions';

-- Additional: Verify all roles have user_management
SELECT 
    id,
    jsonb_object_keys(role_permissions) as role,
    role_permissions->jsonb_object_keys(role_permissions)->'menus' as menus
FROM public.settings
WHERE id = 'rolePermissions';
