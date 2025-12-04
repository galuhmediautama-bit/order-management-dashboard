# Quick Fix: Advertiser Rank Data Disappearing

**TL;DR - The Problem & Solution**

❌ **Problem:** Save advertiser rank data → Reload page → Data gone!

✅ **Root Cause:** RLS policy only allows Super Admin to update settings, not Admin

✅ **Fix:** Update the RLS policy to allow Admin role as well

---

## 30-Second Fix

1. Open Supabase Dashboard
2. Go to: SQL Editor
3. Paste and run this SQL:

```sql
DROP POLICY IF EXISTS "Super Admin can update settings" ON settings;

CREATE POLICY "Admin and Super Admin can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

CREATE POLICY "Admin and Super Admin can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );
```

4. Done! Now Admin users can save CuanRank settings
5. Reload the app and test

---

## What Was Updated

| File | Change |
|------|--------|
| `FIX_CUAN_RANK_RLS.sql` | RLS policy update for Supabase |
| `pages/CuanRankPage.tsx` | Better error messages + verification logging |
| `FIX_ADVERTISER_RANK_DISAPPEARING.md` | Full documentation |

---

## Verification Steps

✓ Save advertiser rank settings  
✓ See "✓ Berhasil Disimpan!" message  
✓ Reload the browser  
✓ Data should still be there!  
✓ Check console (F12) for verification logs  

---

## If Still Not Working

Check:
1. **Your user role** - Must be 'Super Admin' or 'Admin'
2. **Your status** - Must be 'Aktif' (not 'Tidak Aktif')
3. **Browser console** (F12) - Look for error messages
4. **RLS policy was updated** - Go to Supabase → Tables → settings → RLS policies

---

**Files:** See `FIX_CUAN_RANK_RLS.sql` and `FIX_ADVERTISER_RANK_DISAPPEARING.md` for details
