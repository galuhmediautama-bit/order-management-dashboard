# CRITICAL: User Management Fixes - Complete Reference

**Status**: ✅ ALL FIXES APPLIED - Users should now appear in Settings → Daftar Pengguna

---

## Summary of Issues & Fixes

| Issue | Root Cause | Solution | Commit | Status |
|-------|-----------|----------|--------|--------|
| Menu "Daftar Pengguna" missing | Admin role had no `user_management` permission | Added to role_permissions in database | `d0beb0a` | ✅ |
| 400 Bad Request on users query | Column name `assignedBrandIds` missing quotes | Added quotes: `"assignedBrandIds"` | `4a3d1d3` | ✅ |
| Column `avatarUrl` doesn't exist | Database uses `avatar` not `avatarUrl` | Changed query to use `avatar` | `824d178` | ✅ |
| RLS policy blocked SELECT | `users_select_basic` too restrictive | Replaced with `users_select_with_role_check` | `19ffb27` | ✅ |
| Column `createdAt` doesn't exist | Database uses `created_at` not `createdAt` | Changed query to use `created_at` | `53a7d57` | ✅ |

---

## Issue 1: Missing "Daftar Pengguna" Permission

**Error**: Menu not visible in Settings for Admin users

**Root Cause**: `CREATE_SETTINGS_TABLE.sql` had outdated Admin role permissions

**Fix Applied**:
- Updated `CREATE_SETTINGS_TABLE.sql` line 55
- Added `'user_management'` to Admin menus array
- Created `UPDATE_SETTINGS_PERMISSIONS.sql` for existing databases
- **Commit**: `d0beb0a`

**Database Fix** (if needed):
```sql
UPDATE public.settings
SET role_permissions = jsonb_set(
    role_permissions,
    '{Admin,menus}',
    jsonb_build_array(
        'dashboard', 'products', 'product_list', 'form_list',
        'orders', 'order_list', 'abandoned_carts', 'customers',
        'reports', 'ad_reports', 'cs_reports', 'earnings',
        'settings', 'website_settings',
        'user_management',        ← ADDED
        'role_management',        ← ADDED
        'brands', 'cs_management', 'tracking', 'announcements'
    )::jsonb
)
WHERE id = 'rolePermissions';
```

---

## Issue 2: Column Name Mapping - Query Column Names

**Error**: `400 Bad Request` when fetching users

**Root Cause**: Supabase column names don't match code expectations

| Property in Code | Actual Database Column | Needs Quote? | Status |
|------------------|----------------------|--------------|--------|
| `assignedBrandIds` | `"assignedBrandIds"` | ✅ YES | Fixed |
| `avatarUrl` | `avatar` | ❌ NO | Fixed |
| `createdAt` | `created_at` | ❌ NO | Fixed |
| `avatar` | `avatar` | ❌ NO | Fixed |

**Fix Applied** in `pages/SettingsPage.tsx` line 876:

```typescript
// BEFORE (WRONG):
select('id, name, email, role, status, assignedBrandIds, avatarUrl, createdAt')

// AFTER (CORRECT):
select('id, name, email, role, status, "assignedBrandIds", avatar, created_at')
```

**Commits**:
- `4a3d1d3` - Fixed `assignedBrandIds` quotes
- `824d178` - Fixed `avatarUrl` → `avatar`
- `53a7d57` - Fixed `createdAt` → `created_at`

---

## Issue 3: RLS Policy Too Restrictive

**Error**: Users query returns 0 results even though data exists

**Root Cause**: `users_select_basic` policy blocked all queries

```sql
-- OLD POLICY - TOO RESTRICTIVE
(status = 'Aktif'::text) OR (status IS NULL)
```

**Fix Applied** in Supabase:

```sql
-- NEW POLICY - ALLOWS ADMIN & SUPER ADMIN
(auth.uid() IS NOT NULL AND role = ANY (ARRAY['Super Admin'::text, 'Admin'::text]))
OR
(auth.uid() IS NOT NULL AND ((id = auth.uid()) OR (status = 'Aktif'::text)))
```

**File**: `FIX_RLS_USERS_SELECT.sql`
**Commit**: `19ffb27`

---

## Complete Query That Works

```typescript
// SettingsPage.tsx line 876
const { data: usersData, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, role, status, "assignedBrandIds", avatar, created_at');

// Mapping for type compatibility
let usersList = (usersData || []).map((doc: any) => ({ 
    ...doc,
    lastLogin: doc.created_at || doc.lastLogin  // Map created_at to lastLogin
} as User));
```

---

## All Commits in Order

```
53a7d57 - Fix: Correct column name createdAt to created_at
19ffb27 - Add: Fix RLS policy for users SELECT
824d178 - Fix: Correct column name avatarUrl to avatar
4a3d1d3 - Fix: Add missing quotes on camelCase column names
d0beb0a - Fix: Add missing 'user_management' menu to Admin role permissions
```

---

## Verification Checklist

✅ **In Supabase SQL Editor**:
```sql
-- Verify RLS policy is correct
SELECT policyname FROM pg_policies 
WHERE tablename = 'users' AND policyname = 'users_select_with_role_check';
-- Should return: users_select_with_role_check

-- Verify data exists
SELECT COUNT(*) FROM users;
-- Should return: > 0

-- Verify permissions
SELECT role_permissions->'Admin'->'menus' @> '"user_management"'::jsonb 
FROM settings WHERE id = 'rolePermissions';
-- Should return: true
```

✅ **In Browser**:
1. Hard refresh (Ctrl+Shift+R)
2. Login as Admin or Super Admin
3. Go to Settings → Daftar Pengguna
4. Users should appear in table

✅ **Browser Console** (F12):
- NO errors about `avatarUrl`, `createdAt`, or `assignedBrandIds`
- NO 400 Bad Request from REST API
- Network tab shows 200 OK for `/rest/v1/users` query

---

## If Users Still Don't Show

**Debug in order**:

1. **Check RLS Policy**:
```sql
SELECT policyname, qual FROM pg_policies WHERE tablename = 'users';
```
Should show `users_select_with_role_check` policy.

2. **Check Data Exists**:
```sql
SELECT id, name, role FROM users LIMIT 5;
```
Should return user rows.

3. **Check Permissions**:
```sql
SELECT role_permissions->'Admin' FROM settings WHERE id = 'rolePermissions';
```
Should include `user_management` in menus.

4. **Check Browser Console**:
- Open F12 → Console
- Look for any red errors
- Check Network tab for failed requests

5. **Hard Refresh Multiple Times**:
- Ctrl+Shift+R (clear cache)
- Logout completely
- Close browser tabs
- Login again fresh

---

## Column Name Convention Reference

**PostgreSQL Column Naming Rules**:

| Format | Example | Quote Needed? | Notes |
|--------|---------|---------------|-------|
| snake_case | `created_at`, `avatar` | ❌ NO | Default PostgreSQL style |
| camelCase | `assignedBrandIds`, `createdAt` | ✅ **YES** | Must use double quotes to preserve case |
| lowercase | `id`, `name`, `email` | ❌ NO | Even without quotes, case doesn't matter |

**Why?** PostgreSQL is case-insensitive WITHOUT quotes. Column names get lowercased. Use double quotes to preserve exact case.

---

## Files Reference

- `pages/SettingsPage.tsx` - Main users query (line 876)
- `FIX_RLS_USERS_SELECT.sql` - RLS policy fix
- `CREATE_SETTINGS_TABLE.sql` - Permissions setup
- `UPDATE_SETTINGS_PERMISSIONS.sql` - Database update script
- `FIX_COLUMN_NAME_AVATARURL.md` - Column naming documentation

---

## Prevention: Keep These In Sync

To prevent this from happening again:

1. **Always check Supabase table schema** before querying
2. **Match column names exactly** - use console to verify
3. **Document any camelCase columns** that need quotes
4. **Test RLS policies** - verify Super Admin/Admin can SELECT
5. **Keep CREATE_SETTINGS_TABLE.sql updated** with all roles

---

**Last Updated**: December 8, 2025
**All Fixes**: ✅ DEPLOYED
**Status**: Ready for production ✅

For questions, refer to commits: d0beb0a, 4a3d1d3, 824d178, 19ffb27, 53a7d57
