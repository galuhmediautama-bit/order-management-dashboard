-- FIX: Ensure assignedBrandIds column exists and test update

-- Step 1: Create column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS "assignedBrandIds" text[] DEFAULT ARRAY[]::text[];

-- Step 2: Check current schema
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'assignedBrandIds';

-- Step 3: Show all users with their brand assignments
SELECT 
    id,
    name,
    email,
    role,
    "assignedBrandIds",
    array_length("assignedBrandIds", 1) as brands_count
FROM users
ORDER BY name;

-- Step 4: Show all available brands
SELECT id, name FROM brands ORDER BY name;

-- Step 5: Test UPDATE with a specific user
-- Replace 'USER_ID_HERE' and brand IDs with real values
/*
UPDATE users 
SET "assignedBrandIds" = ARRAY[
    'c1b47b7a-8e9d-4a5c-b3f2-1e6d8c9a7b4e',
    '2f3e4d5c-6b7a-8c9d-0e1f-2a3b4c5d6e7f'
]::text[]
WHERE id = 'USER_ID_HERE';
*/

-- Step 6: Alternative - use JSONB if text[] is problematic
-- Check if we should convert to JSONB
SELECT 
    id,
    name,
    "assignedBrandIds"::text as current_value,
    pg_typeof("assignedBrandIds") as current_type
FROM users
WHERE "assignedBrandIds" IS NOT NULL
LIMIT 5;

-- Step 7: If needed, convert column to JSONB
-- UNCOMMENT ONLY IF text[] is not working:
/*
ALTER TABLE users ALTER COLUMN "assignedBrandIds" TYPE jsonb 
USING (
    CASE 
        WHEN "assignedBrandIds" IS NULL THEN '[]'::jsonb
        ELSE to_jsonb("assignedBrandIds")
    END
);
*/

-- Step 8: Set default for existing NULL values
UPDATE users 
SET "assignedBrandIds" = ARRAY[]::text[]
WHERE "assignedBrandIds" IS NULL;

-- Step 9: Check RLS policies that might block updates
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
WHERE tablename = 'users'
  AND cmd = 'UPDATE';
