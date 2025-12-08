-- ============================================
-- ADD: Insert sample users for testing
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check if users table is empty
SELECT COUNT(*) as current_users FROM public.users;

-- Insert sample Super Admin user (use a real UUID from Supabase Auth if you have one)
INSERT INTO public.users (
    id,
    name,
    email,
    phone,
    role,
    status,
    "createdAt"
) VALUES (
    'f1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'::uuid,
    'Admin Dashboard',
    'admin@example.com',
    '081234567890',
    'Super Admin',
    'Aktif',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample Admin user
INSERT INTO public.users (
    id,
    name,
    email,
    phone,
    role,
    status,
    "createdAt"
) VALUES (
    'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'::uuid,
    'Admin User',
    'admin2@example.com',
    '081234567891',
    'Admin',
    'Aktif',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample Customer Service user
INSERT INTO public.users (
    id,
    name,
    email,
    phone,
    role,
    status,
    "createdAt"
) VALUES (
    'c1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'::uuid,
    'Customer Service',
    'cs@example.com',
    '081234567892',
    'Customer service',
    'Aktif',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify users were inserted
SELECT COUNT(*) as total_users FROM public.users;

-- Show all users
SELECT id, name, email, role, status, "createdAt" FROM public.users;
