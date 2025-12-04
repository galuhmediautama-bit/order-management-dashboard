# User Registration Role Bug - Diagnosis & Fix Guide

## Problem Summary
When a user registers through the login page:
- ✅ Form shows options: "Customer Service" or "Advertiser"
- ✅ User selects role and submits
- ✅ Account is created in Supabase Auth
- ❌ But when they login, their role shows as "Super Admin" instead of their selected role

## Root Causes Identified

### 1. **Race Condition During Registration** (Primary)
**Issue**: When user registers, two things happen:
1. User is created in `auth.users` table
2. User profile is inserted into `public.users` table with their selected role

**Problem**: The user might login *before* the profile is fully inserted into `public.users`. When Sidebar tries to fetch the user profile, the query fails or returns no data.

**Fallback**: Old code defaulted to 'Super Admin' when profile wasn't found
```typescript
// OLD CODE (BUGGY) - in Sidebar.tsx
if (error || !userDoc) {
    setCurrentUserRole('Super Admin'); // ❌ WRONG! Defaults to Super Admin
}
```

### 2. **No Retry Logic**
When the first query for user profile fails, it doesn't retry. It just defaults to Super Admin immediately.

### 3. **getNormalizedRole Function Unsafe**
The `getNormalizedRole` function was defaulting to 'Super Admin' when role was undefined:
```typescript
// OLD CODE - in utils.ts
if (!role) return 'Super Admin'; // ❌ WRONG! Could be called during loading
```

## Fixes Applied

### Fix #1: Added Retry Logic with Exponential Backoff
**File**: `components/Sidebar.tsx` - `fetchUserRole` function
```typescript
// NEW CODE - Retry up to 3 times
while (retries < maxRetries && !userDoc) {
    const result = await supabase.from('users').select('*').eq('id', user.id).single();
    error = result.error;
    userDoc = result.data;

    if (!userDoc && retries < maxRetries - 1) {
        // Wait 500ms, then 1000ms, then 1500ms
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retries + 1)));
        retries++;
    }
}
```

### Fix #2: Changed Default Fallback from Super Admin to Admin
**File**: `utils.ts` - `getNormalizedRole` function
```typescript
// NEW CODE - Default to lower privilege
if (!role) {
    console.warn('⚠️ getNormalizedRole called with undefined role...');
    return 'Admin'; // ✅ SAFER: Lower privilege than Super Admin
}
```

### Fix #3: Restrict Access Until Profile Loads
**File**: `components/Sidebar.tsx` - `canSee` function
```typescript
// NEW CODE - Show only basic pages while profile loads
if (!currentUserRole) {
    return item.name === 'Dasbor' || item.name === 'Profil Saya' || item.name === 'Pengaturan Akun';
}
```

## How to Test the Fix

### Test 1: Register a New User
1. Go to login page
2. Click "Daftar di sini"
3. Fill form:
   - Nama Lengkap: "Test User"
   - Peran: Select "👥 Customer Service"
   - Nomor WhatsApp: "081234567890"
   - Alamat: "Jalan Test No 1"
   - Email: "test_cs_123@example.com"
   - Kata Sandi: "Password123"
4. Click "🚀 Daftar Sekarang"

### Test 2: Verify Profile Was Created Correctly
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run query:
```sql
SELECT id, email, name, role, status, created_at 
FROM public.users 
WHERE email = 'test_cs_123@example.com';
```

**Expected result**: Role should be `"Customer service"`, not `"Super Admin"`

If role is NULL or wrong, see **Troubleshooting** section below.

### Test 3: Login and Check Console
1. In Supabase, approve the user (set status = 'Aktif') or set status to 'Aktif' directly:
```sql
UPDATE public.users 
SET status = 'Aktif' 
WHERE email = 'test_cs_123@example.com';
```

2. Try to login with the test account
3. Open browser DevTools (F12 → Console tab)
4. Look for logs:
   - ✅ `✅ Sidebar - User role from DB: Customer service → Normalized: Customer service`
   - ❌ `⚠️ User profile not found in DB after retries...` → Profile creation issue
   - ❌ `❌ Error fetching user role: ...` → Database query error

### Test 4: Check Sidebar Navigation
After login (if approved), the sidebar should show:
- ✅ "Dasbor" (Dashboard) - always visible
- ❌ "Pengaturan" menu - NOT visible for Customer service role
- ❌ "Manajemen Pengguna" - NOT visible for Customer service role

For **Advertiser** role, should see:
- ✅ "Dasbor"
- ✅ "Laporan Iklan" (Ad Reports)
- ✅ "Penghasilan" (Earnings)
- ❌ "Pengaturan" menu - NOT visible

## Troubleshooting

### Issue: Role Still Shows as Super Admin
**Steps**:
1. Check browser console (F12) for error messages
2. Find the log line about role fetching
3. Look for error details

**Solution depends on error**:

#### Error: "User profile not found in DB after retries"
- Profile wasn't created during registration
- **Fix**: Manually create profile in Supabase
```sql
INSERT INTO public.users (id, email, name, role, status, phone, address)
SELECT 
  id, 
  email, 
  email,
  'Customer service',
  'Tidak Aktif',
  NULL,
  NULL
FROM auth.users 
WHERE email = 'test_cs_123@example.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);
```

#### Error: "Error fetching user role: PGRST116..."
- RLS policy issue or row not accessible
- **Fix**: Ensure RLS policy allows self-read (see SQL script)

#### Error: "Error fetching user role: undefined"
- Database connection issue
- **Fix**: Check Supabase console for errors

### Issue: User Keeps Redirecting to Login
**Causes**:
1. Profile status is "Tidak Aktif" (inactive)
2. RLS policy blocking access to own profile
3. User profile doesn't exist

**Fix**:
1. Check user status:
```sql
SELECT id, email, status FROM public.users WHERE email = 'user@example.com';
```

2. If status = 'Tidak Aktif', set to 'Aktif':
```sql
UPDATE public.users SET status = 'Aktif' WHERE email = 'user@example.com';
```

3. If user doesn't exist, create profile (see above)

### Issue: All Users See Super Admin Settings
**Cause**: Multiple fallbacks to Super Admin
- Check role is being saved correctly during registration
- Check RLS policies with:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## Database Script to Run

Execute this in Supabase SQL Editor:

```sql
-- Run: supabase_fix_user_registration_role.sql

-- This script will:
-- 1. Add explicit RLS policies for self-read/update
-- 2. Add validation trigger on user profile insert
-- 3. Show any orphaned user profiles
-- 4. Provide queries to fix specific users
```

## Expected Behavior After Fix

| Action | Before | After |
|--------|--------|-------|
| Register as CS | ❌ Becomes Super Admin | ✅ Stays as Customer service |
| Register as Advertiser | ❌ Becomes Super Admin | ✅ Stays as Advertiser |
| Profile loads | Takes 1 try, fails | ✅ Retries up to 3 times |
| Fallback role | Super Admin (too high) | ✅ Admin (safer) |
| Console log | Redirects silently | ✅ Clear error messages |

## Code Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `Sidebar.tsx` | Added retry loop (3x) | Handles race conditions |
| `utils.ts` | Changed fallback to 'Admin' | Prevents privilege escalation |
| `Sidebar.tsx` | Restrict unloaded users | Prevents showing Super Admin menu |
| `supabase_fix_user_registration_role.sql` | RLS policies + validation | Ensures data consistency |

## Next Steps

1. ✅ Deploy code changes (already done)
2. Run `supabase_fix_user_registration_role.sql` in Supabase SQL Editor
3. Test with new user registration
4. Monitor browser console for logs
5. If issues persist, check database directly with provided queries
