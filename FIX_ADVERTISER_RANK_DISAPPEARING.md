# Fix: Advertiser Rank Disappearing After Reload

## Problem Identified

When you fill in advertiser rank settings and click save, the data appears to save successfully but disappears when you reload the page.

### Root Cause

The issue has **two parts**:

1. **RLS Policy Restriction**: The Supabase RLS (Row Level Security) policy on the `settings` table only allows **Super Admin** to update settings. If you're logged in as **Admin** or another role, the update fails silently, and the data never actually gets saved to the database.

2. **JSONB Serialization**: When saving nested arrays in Supabase JSONB columns, the structure must be preserved exactly. The advertiser rules need to be stored properly with all required fields.

## Solution Implemented

### 1. Updated RLS Policy (FIX_CUAN_RANK_RLS.sql)

**What changed:**
- Updated the RLS policy to allow both **Super Admin** AND **Admin** to update settings
- Added INSERT and DELETE policies for Admin role as well

**How to apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `FIX_CUAN_RANK_RLS.sql`
3. Run the SQL script
4. Test saving again as Admin user

**The SQL:**
```sql
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Super Admin can update settings" ON settings;

-- Create new policy that allows both Super Admin and Admin
CREATE POLICY "Admin and Super Admin can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- Also add INSERT and DELETE policies
CREATE POLICY "Admin and Super Admin can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

CREATE POLICY "Admin and Super Admin can delete settings" ON settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );
```

### 2. Improved Error Handling (CuanRankPage.tsx)

**What changed:**
- Added `saveError` state to capture error messages
- Improved error detection for permission issues
- Added user-friendly error message display in UI
- Added verification logging to check if save actually persisted

**User Experience:**
- If save fails due to permission, users now see: "Anda tidak memiliki izin untuk mengubah pengaturan. Hanya Super Admin atau Admin yang dapat menyimpan CuanRank."
- If save fails for other reasons, the actual error message is displayed
- Console logs what data was saved and verification results

### 3. Data Structure Fix

**What changed:**
- When saving advertiser rules, now only persists the fields that should be stored: `rank`, `minLeads`, `minRoas`
- The `minSpending` field is recalculated on load using the formula: `minLeads * COST_PER_LEAD_EST`
- This ensures consistency and avoids any serialization issues with calculated fields

## How to Verify the Fix Works

1. **Apply the RLS policy fix** to Supabase
2. **Log in as Admin user** (not Super Admin)
3. **Navigate to** 📊 Pengaturan → 🏆 CuanRank
4. **Fill in some advertiser rank data** (e.g., set leads for different ranks)
5. **Click "Simpan Perubahan"** button
6. **Check for the success message** (green checkmark)
7. **Reload the page** - data should still be there!
8. **Check browser console** for verification logs showing the data was actually saved

## Troubleshooting

### Still not working after applying RLS fix?

1. **Check your user role:**
   - Log in to Supabase Dashboard
   - Go to Authentication → Users
   - Find your account and verify role is 'Super Admin' or 'Admin'
   - Make sure status is 'Aktif' (not 'Tidak Aktif')

2. **Check the browser console for errors:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages when clicking Save
   - Copy the error message and troubleshoot based on the error type

3. **Verify the RLS policy was updated:**
   - Go to Supabase Dashboard
   - Tables → settings → RLS policies
   - Confirm you see the new "Admin and Super Admin can..." policies

### Permission denied errors?

This means:
- Your user role is not 'Super Admin' or 'Admin', OR
- Your status is not 'Aktif'

Contact your system administrator to grant the appropriate role.

## Files Modified

1. **FIX_CUAN_RANK_RLS.sql** - New file with RLS policy update
2. **pages/CuanRankPage.tsx** - Enhanced error handling and UI feedback

## Testing Checklist

- [ ] Applied RLS policy fix to Supabase
- [ ] Logged in as Admin user
- [ ] Filled in advertiser rank data
- [ ] Clicked Save and saw success message
- [ ] Reloaded page and data persisted
- [ ] Checked console logs to verify save
- [ ] Tested with different rank values

## Notes

- The fix supports both Super Admin and Admin roles editing CuanRank
- If you need to extend this to other roles (e.g., 'Keuangan'), update the RLS policy to include them in the role list
- The advertiser rank rules are stored as JSONB in the `settings` table with `id = 'cuanRank'`
