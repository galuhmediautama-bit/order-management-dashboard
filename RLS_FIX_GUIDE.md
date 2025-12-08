# RLS FIX IMPLEMENTATION - Step by Step

## Problem Summary
- Sidebar showing only "Dashboard"
- Dashboard data showing "Tidak ada data"
- Root cause: RLS SELECT policies too restrictive

## Current Status
- ✅ FIX_RLS_SIMPLE.sql created (disable RLS for testing)
- ✅ FIX_RLS_PROPER.sql created (proper policies)
- ⏳ Need execution in Supabase

## Implementation Steps

### Step 1: Disable RLS (Temporary - for verification)
**File**: `QUICK_FIX_RLS_SIMPLE.sql`
**What it does**:
- Fixes users SELECT policy (admin sees all, user sees self)
- Disables RLS on orders, forms, products, settings tables
- This lets us verify RLS was the problem

**Execute in Supabase SQL Editor**:
1. Open https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy content of `QUICK_FIX_RLS_SIMPLE.sql`
4. Click "Run"
5. Go back to app, press F5 (refresh browser)
6. Check: Does sidebar show menu items? Does dashboard show data?

### Step 2: If sidebar/data appear = RLS was the problem
Then run `FIX_RLS_PROPER.sql` to re-enable RLS with correct policies

**Execute in Supabase SQL Editor**:
1. Copy content of `FIX_RLS_PROPER.sql`
2. Click "Run"
3. Refresh browser again
4. Verify everything still works with RLS enabled

### Step 3: If sidebar/data still missing = Different problem
Then check browser console:
- Open DevTools (F12)
- Go to Console tab
- Look for errors
- Paste this diagnostic:
```javascript
// Run in browser console to test queries
(async () => {
  const { data, error } = await window.supabaseClient
    .from('users')
    .select('id, email, role')
    .limit(5);
  console.log({ error, data });
})();
```

## Expected Results After Step 1 (QUICK_FIX_RLS_SIMPLE.sql)

✅ Sidebar shows all menu items (Pesanan, Produk, etc)
✅ Dashboard shows data (not "Tidak ada data")
✅ Admin can view users
✅ Orders display with proper counts

## Files Created
1. `QUICK_FIX_RLS_SIMPLE.sql` - Temporary fix (disable RLS)
2. `FIX_RLS_PROPER.sql` - Permanent fix (enable RLS with policies)
3. `DIAGNOSTIC_RLS.js` - Browser console diagnostic tool
4. This documentation file

## Proper RLS Logic

### Users Table
- **SELECT**: Self OR Admin (checks role from DB)
- **INSERT**: Self OR Admin
- **UPDATE**: Self OR Admin
- **DELETE**: Admin only

### Orders Table
- **SELECT**: All data if Admin, own data if CS (assignedCsId = auth.uid)
- **INSERT**: Anyone can create orders
- **UPDATE**: Admin or owner
- **DELETE**: Admin only

### Forms, Products, Settings
- **SELECT**: All authenticated users can read
- **INSERT/UPDATE/DELETE**: Admin only

## Troubleshooting

### If SQL execution fails
- Check syntax errors in error message
- Ensure all policy names match (no typos)
- Try running policies one table at a time

### If sidebar still empty after Step 1
- Check browser console for JS errors
- Check Network tab for 403 errors
- Verify RLS policies were actually created:
  ```sql
  SELECT * FROM pg_policies WHERE tablename IN ('users', 'orders')
  ```

### If data appears but incomplete
- May need additional filtering logic in components
- Check Sidebar.tsx canSee() function
- Verify RolePermissionsContext is loading properly

## Next Actions
1. Run `QUICK_FIX_RLS_SIMPLE.sql` in Supabase
2. Refresh app browser (F5)
3. Report: Does sidebar/data appear?
4. If YES: Run `FIX_RLS_PROPER.sql`
5. If NO: Check browser console errors (see Troubleshooting)
