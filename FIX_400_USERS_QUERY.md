# Debug: 400 Bad Request on Users Query

## Problem
```
GET /rest/v1/users?select=id%2Cname%2Cemail%2Crole%2Cstatus%2C%22assignedBrandIds%22%2CavatarUrl%2CcreatedAt 
→ 400 (Bad Request)

Error: "tidak ketemu user!"
```

## Troubleshooting Steps

### Option 1: Check if Table Exists (Supabase SQL Editor)
Run this script to see table structure and identify problem columns:
```sql
-- Check table exists
SELECT * FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
```

### Option 2: Test Columns One by One
If Option 1 shows all columns exist, run step-by-step:

```sql
-- Test 1: Simple columns
SELECT id, name FROM users LIMIT 1;

-- Test 2: Add email
SELECT id, name, email FROM users LIMIT 1;

-- Test 3: Add camelCase columns with quotes
SELECT id, name, email, role, status, "avatarUrl", "createdAt" FROM users LIMIT 1;

-- Test 4: Add assignedBrandIds
SELECT id, name, email, role, status, "assignedBrandIds" FROM users LIMIT 1;

-- Test 5: Full query
SELECT 
    id, name, email, role, status,
    "assignedBrandIds", "avatarUrl", "createdAt"
FROM users LIMIT 1;
```

### Option 3: Check RLS Policies
RLS might be blocking the query:
```sql
-- See all RLS policies
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- Check if RLS is enabled
SELECT rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

### Option 4: Check Row Count
```sql
-- Verify data exists
SELECT COUNT(*) as total_users FROM users;
```

## Common Issues & Fixes

### Issue 1: Column doesn't exist
**Error**: `column "xyz" does not exist`
**Fix**: Check exact column name in Supabase:
- Use double quotes for camelCase: `"assignedBrandIds"`
- Use single quotes for string values: `'value'`
- Some columns may have different names than expected

### Issue 2: RLS policy blocking SELECT
**Error**: `400 Bad Request` with no data returned
**Fix**: Check RLS policies - you might need a policy like:
```sql
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);
```

### Issue 3: Column type mismatch
**Error**: `400 Bad Request` when selecting specific columns
**Fix**: Could be a column type issue. Try casting:
```sql
SELECT 
    id::uuid,
    name::text,
    "assignedBrandIds"::text[]
FROM users LIMIT 1;
```

### Issue 4: Missing columns
If certain columns are missing entirely, they might not be in the table yet.

**Solution**: Check what columns actually exist:
```sql
\d users  -- psql command, shows table structure
```

Or in Supabase UI:
1. Go to **Table Editor**
2. Click on **users** table
3. See column list on the right panel

## Solution Template

Once you identify the problem, run the appropriate fix:

### Fix A: If column doesn't exist
Create the missing column:
```sql
ALTER TABLE public.users
ADD COLUMN "columnName" dataType DEFAULT null;
```

### Fix B: If RLS is too strict
Update or create permissive RLS policy:
```sql
DROP POLICY IF EXISTS "restrictive_policy" ON public.users;

CREATE POLICY "Allow users to read"
ON public.users
FOR SELECT
USING (true);  -- Allow all authenticated users to read
```

### Fix C: If columns have wrong names
Update the frontend query to use correct column names.

## Steps to Resolve

1. **Run `DEBUG_USERS_TABLE.sql`** in Supabase SQL Editor
2. **Identify which step fails** (note the error message)
3. **Apply appropriate fix from above**
4. **Test with simple query**: `SELECT * FROM users LIMIT 1;`
5. **Hard refresh browser** (Ctrl+Shift+R)
6. **Test frontend again**

## Expected Output

If everything works:
- Table structure shows all columns (id, name, email, role, status, assignedBrandIds, avatarUrl, createdAt)
- Each SELECT test passes without error
- RLS policies are either disabled or allow SELECT
- COUNT query shows > 0 users

## Next Steps

Once fixed, users should appear in the admin panel. If still not working:
1. Check browser console for other errors
2. Verify Supabase API key in `firebase.ts`
3. Check network tab for actual request/response
4. Verify user is logged in with valid session

---
**File created**: `DEBUG_USERS_TABLE.sql`
**Action**: Copy & run in Supabase SQL Editor to identify the issue
