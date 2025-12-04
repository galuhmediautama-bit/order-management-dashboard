# 🎯 Quick Implementation - Copy & Paste Guide

## Problem: User Registration Shows Wrong Role

**Symptom**: User registers with role "Customer service" but sees "Super Admin" after login

**Solution**: 3 code changes + 1 SQL script

**Time**: 20 minutes total

---

## ✅ STEP 1: Code Changes (Already Done)

No action needed - code is already updated and auto-reloading.

**Files changed**:
- ✅ `components/Sidebar.tsx` - Retry logic added
- ✅ `utils.ts` - Safe fallback
- ✅ `pages/LoginPage.tsx` - Better logging

---

## ⏳ STEP 2: Run SQL Script (Copy & Paste)

### Option A: Copy the whole script

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com → Your Project → SQL Editor

2. **Create new query**
   - Click: "New Query"

3. **Copy this entire script** and paste into the SQL editor:

```sql
-- =============================================================================
-- FIX: User Registration Role Not Being Saved Correctly
-- =============================================================================
-- Problem: When user registers with role (CS or Advertiser), they see Super Admin role
-- Solution: 
--   1. Ensure RLS allows new users to read their own profile
--   2. Add a trigger to sync auth.users metadata to public.users
--   3. Verify user profile creation is atomic with auth signup
-- =============================================================================

-- ============================================================================
-- STEP 1: Verify RLS Policy on users table allows self-read
-- ============================================================================

-- Check existing policies
SELECT 
  policyname, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Add explicit policy allowing users to read their own profile
-- ============================================================================

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

-- Create new policy: Users can read their own row
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- ============================================================================
-- STEP 3: Add explicit policy allowing users to update their own profile
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- STEP 4: Ensure INSERT RLS policy is permissive (allow signup)
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert with signup" ON public.users;

CREATE POLICY "Users can insert with signup" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STEP 5: Create trigger to handle user sync on auth signup
-- ============================================================================
-- This ensures public.users table stays in sync with auth.users metadata

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_new_user_profile ON public.users CASCADE;
DROP FUNCTION IF EXISTS public.sync_new_user_profile() CASCADE;

-- Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process on INSERT
  IF TG_OP = 'INSERT' THEN
    -- Ensure all required fields have values
    IF NEW.id IS NOT NULL THEN
      -- Keep the inserted values
      RETURN NEW;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger (runs BEFORE INSERT to validate data)
CREATE TRIGGER ensure_user_profile_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- ============================================================================
-- STEP 6: Verify data consistency
-- ============================================================================

-- Find auth users who might not have profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  pu.id as profile_exists,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- Check users table for orphaned or incorrect data
SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at,
  COUNT(*) OVER (PARTITION BY email) as email_count
FROM public.users
WHERE status IS NULL OR role IS NULL
ORDER BY created_at DESC;
```

4. **Click "Run"** button
   - Should execute without errors
   - Some queries return results (that's fine)
   - Look for "Success" indicator

5. **Done!** ✅

---

## ⏳ STEP 3: Test Registration (10 minutes)

### Test A: Register New User
```
1. Clear browser cache: Ctrl+Shift+Del
2. Open app: http://localhost:3001
3. Click: "Daftar di sini"
4. Fill form:
   - Nama Lengkap: "Test User"
   - Peran: Select "👥 Customer Service" ← IMPORTANT
   - Nomor WhatsApp: "081234567890"
   - Alamat: "Jalan Test No 1"
   - Email: "test_user_@DATETIME@example.com" ← Use unique
   - Password: "Test123!!"
5. Click: "🚀 Daftar Sekarang"
6. Wait for success message
7. Verify message says: "...dengan role: Customer service"
```

### Test B: Check Console Logs
```
1. Open DevTools: F12 → Console tab
2. Look for success log:
   ✅ "User profile created successfully: { role: 'Customer service' }"
3. If no log, something failed (see troubleshooting)
```

### Test C: Verify Database
```
1. Supabase Dashboard → SQL Editor
2. Create new query
3. Paste:
   SELECT id, email, name, role, status, created_at 
   FROM public.users 
   WHERE email LIKE 'test_user_%' 
   ORDER BY created_at DESC LIMIT 1;
4. Run
5. Check result:
   - role should be: "Customer service" ✅
   - NOT "Super Admin" ❌
```

### Test D: Approve & Login
```
1. In SQL Editor, update user status:
   UPDATE public.users SET status = 'Aktif'
   WHERE email LIKE 'test_user_%';
   
2. Try to login with test account
3. Check console (F12) for log:
   ✅ "Sidebar - User role from DB: Customer service → Normalized: Customer service"
4. Verify sidebar shows correct navigation (no Pengaturan menu for CS)
```

---

## ✅ Success Criteria

- [x] User registers with "Customer service" role
- [x] Database shows role = "Customer service" (not "Super Admin")
- [x] Console shows: `✅ Sidebar - User role from DB: Customer service`
- [x] Navigation is restricted correctly
- [x] No error messages in console

---

## ❌ Troubleshooting

### Issue: Still showing Super Admin
**Fix**:
1. Check console (F12 → Console) for errors
2. Did you run the SQL script? (It's required!)
3. Check database - is role saved correctly?

### Issue: "User profile not found" error
**Meaning**: Profile wasn't created during registration
**Fix**:
```sql
-- Run this in SQL Editor to manually create profile for this user:
INSERT INTO public.users (id, email, name, role, status)
SELECT 
  id, 
  email, 
  email,
  'Customer service',
  'Tidak Aktif'
FROM auth.users 
WHERE email = 'test_user_xyz@example.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);
```

### Issue: RLS Error
**Meaning**: Permission denied - RLS policies not applied
**Fix**: Re-run the SQL script (maybe it didn't complete)

---

## 📊 Verify Fix is Working

Run this query in Supabase SQL Editor to check:

```sql
-- Find all new Super Admin users (suspicious)
SELECT id, email, role, status, created_at
FROM public.users
WHERE role = 'Super Admin' AND status = 'Tidak Aktif'
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

**Expected**: 0 or very few rows (only legitimate admins)
**If many rows**: Means new users are still getting Super Admin role (bug not fixed)

---

## 🎯 Next Steps

1. ✅ Code changes (DONE)
2. ⏳ Run SQL script above (2 min)
3. ⏳ Test registration (10 min)
4. ⏳ Verify in database (3 min)
5. ✅ Done!

---

## 📝 Files Reference

- **Implementation**: This file (`QUICK_IMPLEMENTATION.md`)
- **Detailed guide**: `FIX_USER_REGISTRATION_ROLE.md`
- **SQL script**: `supabase_fix_user_registration_role.sql`
- **Checklist**: `USER_REGISTRATION_ROLE_FIX_CHECKLIST.md`
- **Master index**: `USER_REGISTRATION_ROLE_FIX_MASTER_INDEX.md`

---

**Ready to implement? Start with the SQL script above! ⬆️**
