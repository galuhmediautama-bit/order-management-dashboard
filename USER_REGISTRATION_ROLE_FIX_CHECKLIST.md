# User Registration Role Fix - Implementation Checklist

## Status: ✅ Code Changes Complete

### Code Changes (DONE ✅)

- [x] **Sidebar.tsx** - Add retry logic for fetching user profile
  - Retries up to 3 times with exponential backoff
  - Better error logging
  - Changed default fallback from Super Admin to null

- [x] **utils.ts** - Fix unsafe fallback in getNormalizedRole
  - Changed: `if (!role) return 'Super Admin'`
  - To: `if (!role) return 'Admin'` (safer, lower privilege)
  - Added warning log

- [x] **LoginPage.tsx** - Better logging during registration
  - Log role being saved
  - Show role in success message
  - Better error details

### Database Changes (TODO ⏳)

- [ ] **Run SQL script in Supabase SQL Editor**
  ```
  File: supabase_fix_user_registration_role.sql
  
  This adds:
  - RLS policy: "Users can read own profile"
  - RLS policy: "Users can update own profile"
  - Validation trigger on user profile insert
  - Diagnostic queries
  ```

### Testing (TODO ⏳)

#### Test 1: New User Registration
- [ ] Go to login page
- [ ] Click "Daftar di sini"
- [ ] Select role: **"Customer service"** (important!)
- [ ] Fill all fields
- [ ] Submit
- [ ] Check success message shows "...dengan role: Customer service"

#### Test 2: Database Verification
- [ ] Open Supabase SQL Editor
- [ ] Run query:
  ```sql
  SELECT id, email, role, status FROM public.users 
  WHERE email = '<test_email>' LIMIT 1;
  ```
- [ ] Verify: `role = 'Customer service'` (NOT Super Admin)

#### Test 3: User Approval
- [ ] Update user status to 'Aktif':
  ```sql
  UPDATE public.users SET status = 'Aktif' 
  WHERE email = '<test_email>';
  ```

#### Test 4: Login & Console Check
- [ ] Login with test account
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for log:
  - ✅ Should see: `✅ Sidebar - User role from DB: Customer service`
  - ❌ Should NOT see error about profile not found

#### Test 5: Navigation
- [ ] Check sidebar navigation:
  - For **Customer service** user:
    - ✅ See: Dasbor
    - ❌ NOT: Pengaturan menu
    - ❌ NOT: Manajemen Pengguna
  - For **Advertiser** user:
    - ✅ See: Dasbor, Laporan Iklan, Penghasilan
    - ❌ NOT: Pengaturan menu

### Monitoring (TODO ⏳)

- [ ] **Check for suspicious users** (run in Supabase SQL Editor):
  ```sql
  SELECT id, email, role, status, created_at
  FROM public.users
  WHERE role = 'Super Admin' AND status = 'Tidak Aktif'
  ORDER BY created_at DESC;
  ```
  - New users should NOT be Super Admin (unless explicit owner)

- [ ] **Check for profile creation failures**:
  ```sql
  SELECT COUNT(*) FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  ```
  - Should return 0 (all auth users have profiles)

### Quick Troubleshooting

If user still shows Super Admin after login:

1. **Check browser console** (F12 → Console)
   - Look for error starting with "⚠️" or "❌"
   - Note the exact error message

2. **Check database** (Supabase SQL Editor)
   ```sql
   SELECT * FROM public.users WHERE email = '<user_email>' LIMIT 1;
   ```
   - Is role correct in database?
   - Is status 'Aktif'?

3. **Try these fixes**:
   - Clear browser cache (Ctrl+Shift+Del)
   - Restart browser
   - Check RLS policies exist (run `supabase_user_registration_verification.sql`)
   - Manually update user role:
     ```sql
     UPDATE public.users 
     SET role = 'Customer service'
     WHERE email = '<user_email>';
     ```

### Files Modified

```
✅ components/Sidebar.tsx
✅ utils.ts
✅ pages/LoginPage.tsx
✅ supabase_fix_user_registration_role.sql (new - needs to be run)
✅ supabase_user_registration_verification.sql (new - for diagnostics)
✅ FIX_USER_REGISTRATION_ROLE.md (new - detailed guide)
✅ USER_REGISTRATION_ROLE_FIX.md (new - summary)
✅ USER_REGISTRATION_ROLE_FIX_CHECKLIST.md (this file)
```

## Implementation Steps

### Step 1: Verify Code Changes ✅ (Already Done)
```
Code changes are already committed to:
- Sidebar.tsx
- utils.ts  
- LoginPage.tsx
```

### Step 2: Run Database Script ⏳
```
1. Go to Supabase Dashboard
2. Navigate to: SQL Editor
3. Copy entire content of: supabase_fix_user_registration_role.sql
4. Paste into editor
5. Click "Run" button
6. Wait for success (should see "Success" message)
7. Do NOT get errors about existing objects (DROP IF EXISTS handles that)
```

### Step 3: Verify RLS Policies ⏳
```
1. Go to Supabase Dashboard
2. Navigate to: SQL Editor
3. Run:
   SELECT * FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
4. Should see policies:
   - users_allow_all_select
   - users_allow_all_insert
   - users_allow_all_update
   - users_allow_all_delete
   - Users can read own profile
   - Users can update own profile
```

### Step 4: Test New Registration ⏳
```
1. Clear browser cache (Ctrl+Shift+Delete)
2. Open app in new browser window
3. Go to login page → "Daftar"
4. Register test user with:
   - Name: "Test User"
   - Email: "test_role_check_@datetime@example.com" (use unique)
   - Role: "Customer service" (IMPORTANT!)
   - Password: "Test123!!"
5. Verify success message
6. Check console for logs
```

### Step 5: Verify in Database ⏳
```
1. Supabase → SQL Editor
2. Run verification query:
   SELECT id, email, role, status, created_at 
   FROM public.users 
   WHERE email LIKE 'test_role_check_%' 
   ORDER BY created_at DESC LIMIT 1;
3. Confirm: role = 'Customer service' (not Super Admin)
```

### Step 6: Approve & Test Login ⏳
```
1. Update user status:
   UPDATE public.users SET status = 'Aktif'
   WHERE email LIKE 'test_role_check_%';

2. Try to login with test account
3. Open DevTools (F12)
4. Check console for success log
5. Verify navigation is restricted correctly
```

## Success Criteria

✅ **Fix is working when:**
1. New user registers with Customer service role
2. Database shows role = 'Customer service' (not Super Admin)
3. Console log shows: `✅ Sidebar - User role from DB: Customer service`
4. Sidebar navigation restricted (no Pengaturan menu)
5. Multiple test registrations work consistently

❌ **Fix failed if:**
1. User shows Super Admin even after selecting Customer service
2. Database shows role = 'Super Admin' for new inactive user
3. Console shows: `⚠️ User profile not found in DB after retries`
4. Sidebar shows all menus (admin only)
5. Error logs in Supabase

## Rollback Plan

If something goes wrong:

1. **Revert code changes**:
   ```bash
   git checkout components/Sidebar.tsx utils.ts pages/LoginPage.tsx
   ```

2. **Revert database changes** (optional, they're safe):
   ```
   Just remove the new RLS policies in Supabase
   (The retry logic in code is what matters most)
   ```

3. **Restart app** and test again

## Timeline

- **Code changes**: ✅ Done (5 min)
- **SQL script**: ⏳ 2 min to run
- **Testing**: ⏳ 10-15 min
- **Total**: ~20 minutes

## Questions?

If user registration role fix doesn't work:

1. Share console error from Step 4 (F12 → Console)
2. Share database query result from Step 5
3. Share Supabase SQL logs (if any errors)
4. Check if email confirmation is blocking signup

---

**Next Action**: Run `supabase_fix_user_registration_role.sql` in Supabase SQL Editor →  then test registration
