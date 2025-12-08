# Fix: Column Name Mismatch - avatarUrl vs avatar

## Problem
```
ERROR: 42703: column "avatarUrl" does not exist
HINT: Perhaps you meant to reference the column "users.avatar"
```

Query yang error:
```sql
SELECT id, name, email, role, status, "assignedBrandIds", "avatarUrl", "createdAt"
```

## Root Cause
- **Database column**: `avatar` (snake_case atau plain name)
- **Code expected**: `avatarUrl` (camelCase)
- **Mismatch**: Ada ketidakcocokan antara nama di database dan kode

## Solution Applied

### Fixed in Code:
1. ✅ `SettingsPage.tsx` line 876: Changed `avatarUrl` → `avatar`
2. ✅ `DEBUG_USERS_TABLE.sql`: Updated debug queries
3. ✅ `FIX_400_USERS_QUERY.md`: Updated documentation

### Current Column Names (Verified):
| Property | Database Column | TypeScript Type | Notes |
|----------|-----------------|-----------------|-------|
| ID | `id` | `string` | UUID primary key |
| Name | `name` | `string` | User full name |
| Email | `email` | `string` | Email address |
| Role | `role` | `UserRole` | Super Admin, Admin, etc |
| Status | `status` | `UserStatus` | Aktif / Tidak Aktif |
| Avatar | `avatar` | `string` | ✅ **No quote needed** |
| Created At | `"createdAt"` | `string` | ✅ **Needs double quote (camelCase)** |
| Assigned Brand IDs | `"assignedBrandIds"` | `string[]` | ✅ **Needs double quote (camelCase)** |

## Corrected Query

**New working query:**
```sql
SELECT 
    id, 
    name, 
    email, 
    role, 
    status,
    "assignedBrandIds",
    avatar,
    "createdAt"
FROM users 
LIMIT 1;
```

**Key differences:**
- `avatar` - ❌ NO quotes (simple column name)
- `"assignedBrandIds"` - ✅ WITH quotes (camelCase)
- `"createdAt"` - ✅ WITH quotes (camelCase)

## Column Naming Convention in Database

The database uses **mixed naming conventions**:

| Type | Example | Quote Needed? |
|------|---------|---------------|
| Snake case | `created_at`, `avatar` | ❌ No |
| camelCase | `createdAt`, `assignedBrandIds` | ✅ Yes |
| Plain lowercase | `id`, `name`, `email`, `role`, `status` | ❌ No |

**Why?** 
- PostgreSQL is case-sensitive when double quotes are used
- Without quotes, PostgreSQL converts to lowercase
- camelCase columns MUST have quotes to preserve case

## Testing

**To verify fix works:**

1. **In Supabase SQL Editor:**
```sql
SELECT id, name, avatar, "createdAt", "assignedBrandIds" 
FROM users 
LIMIT 5;
```

2. **In browser:**
- Hard refresh (Ctrl+Shift+R)
- Go to Settings → Daftar Pengguna
- Should see user list now ✅

3. **Check browser console:**
- Should NOT see 400 Bad Request error
- Should see users loaded

## Files Changed
- ✅ `pages/SettingsPage.tsx` - Fixed query
- ✅ `DEBUG_USERS_TABLE.sql` - Updated debug script
- ✅ `FIX_400_USERS_QUERY.md` - Updated docs
- ✅ Commit `824d178` - All fixes pushed

## Related Issues

This was causing:
- ❌ 400 Bad Request errors
- ❌ "tidak ketemu user!" message
- ❌ Admin panel showing no users
- ❌ Menu "Daftar Pengguna" appearing empty

All should now be fixed ✅

---
**Status**: ✅ FIXED and deployed
**Deploy**: Already in main branch, just hard refresh browser
