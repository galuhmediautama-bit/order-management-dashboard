-- DEBUG: Check assignedBrandIds column in users table

-- 1. Check if column exists and its data type
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name ILIKE '%brand%';

-- 2. Check current values in assignedBrandIds column
SELECT 
    id,
    name,
    email,
    role,
    "assignedBrandIds"
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if there are any brands in the brands table
SELECT id, name FROM brands ORDER BY name;

-- 4. Try to manually update a user with assignedBrandIds
-- UNCOMMENT and replace the values to test:
-- UPDATE users 
-- SET "assignedBrandIds" = ARRAY['brand-id-1', 'brand-id-2']::text[]
-- WHERE id = 'user-id-here';

-- 5. Verify the update worked
-- SELECT id, name, "assignedBrandIds" FROM users WHERE id = 'user-id-here';

-- 6. Check data type - should be text[] or jsonb
SELECT 
    pg_typeof("assignedBrandIds") as column_type,
    "assignedBrandIds"
FROM users 
WHERE "assignedBrandIds" IS NOT NULL 
LIMIT 1;

-- 7. If column doesn't exist, create it
-- UNCOMMENT to create:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS "assignedBrandIds" text[] DEFAULT ARRAY[]::text[];

-- 8. Check for any constraints on the column
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
  AND kcu.column_name = 'assignedBrandIds';
