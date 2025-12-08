-- ============================================
-- DEBUG: Check users table structure and RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check users table exists and columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 3: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY tablename, policyname;

-- Step 4: Try simple SELECT on users
SELECT id, name FROM users LIMIT 1;

-- Step 5: Try selecting all available columns
SELECT * FROM users LIMIT 1;

-- Step 6: Check specific columns one by one
-- This helps identify which column is causing the 400 error
SELECT 
    id, 
    name, 
    email, 
    role, 
    status 
FROM users LIMIT 1;

-- Step 7: If above works, try with more columns
SELECT 
    id, 
    name, 
    email, 
    role, 
    status,
    "avatarUrl",
    "createdAt"
FROM users LIMIT 1;

-- Step 8: If above works, try with assignedBrandIds
SELECT 
    id, 
    name, 
    email, 
    role, 
    status,
    "assignedBrandIds"
FROM users LIMIT 1;

-- Step 9: Full query that should work
SELECT 
    id, 
    name, 
    email, 
    role, 
    status,
    "assignedBrandIds",
    "avatarUrl",
    "createdAt"
FROM users LIMIT 1;

-- Step 10: Get row count
SELECT COUNT(*) as total_users FROM users;
