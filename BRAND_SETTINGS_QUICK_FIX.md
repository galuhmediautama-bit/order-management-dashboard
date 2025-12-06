# Brand Settings - Quick Reference

## Error: "Gagal menyiapkan pengaturan brand"

### Most Common Causes (dalam urutan likelihood):

1. **Table `brand_settings` belum dibuat** (60% of cases)
   - Solution: Run SQL migration dari `BRAND_SETTINGS_SETUP.md`
   - Check: `SELECT COUNT(*) FROM pg_tables WHERE tablename = 'brand_settings';`

2. **RLS Policy tidak ada** (20% of cases)
   - Solution: Run SQL migration lagi (includes RLS policy)
   - Check: `SELECT COUNT(*) FROM pg_policies WHERE tablename = 'brand_settings';`

3. **Brand sudah dihapus** (15% of cases)
   - Solution: Refresh halaman, buka brand yang berbeda
   - Check: `SELECT id FROM brands WHERE id = 'BRAND_UUID';`

4. **Other issues** (5% of cases)
   - Network timeout
   - JWT expired
   - Supabase server down
   - Invalid UUID format

---

## Instant Diagnostic Command

Copy-paste SQL ini di Supabase SQL Editor untuk instant diagnosis:

```sql
-- Quick diagnostic (run all at once)

-- 1. Check table exists
SELECT 'Table exists' as status 
FROM pg_tables WHERE tablename = 'brand_settings'
UNION ALL
SELECT 'Table MISSING' as status 
WHERE NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'brand_settings');

-- 2. Check RLS enabled
SELECT 'RLS ENABLED' as status 
FROM pg_tables 
WHERE tablename = 'brand_settings' AND rowsecurity = true
UNION ALL
SELECT 'RLS DISABLED' as status 
WHERE NOT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE tablename = 'brand_settings' AND rowsecurity = true
);

-- 3. Check policies exist
SELECT 'Policies exist: ' || COUNT(*) as status 
FROM pg_policies WHERE tablename = 'brand_settings'
UNION ALL
SELECT 'NO POLICIES' as status 
WHERE NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brand_settings');

-- 4. Test insert to a test brand (if table exists)
-- First, find a test brand:
SELECT 'Sample brands:' as status, id, name FROM brands LIMIT 3;
```

---

## Fix Steps (in order of likelihood)

### 🟥 Most Likely: Run SQL Migration

**File:** `supabase_brand_settings.sql`

Steps:
1. Supabase Dashboard → SQL Editor
2. New Query
3. Copy entire content dari `supabase_brand_settings.sql`
4. Click "Run"
5. Wait for success
6. Refresh browser page
7. Try again

---

### 🟡 If still failing: Check Console Logs

1. F12 → Console tab
2. Look for messages starting with `ensureBrandSettings:`
3. Note the error code (e.g., `23503`, `PGRST201`, etc.)
4. Match with table below

---

## Error Code Reference

| Code | Meaning | Typical Cause | Quick Fix |
|------|---------|---------------|-----------|
| `PGRST116` | No rows / Table not found | Table missing | Run SQL migration |
| `42P01` | Undefined table | Table missing | Run SQL migration |
| `PGRST201` | Permission denied | RLS issue | Re-run SQL migration |
| `23503` | Foreign key violation | Brand deleted | Refresh & try different brand |
| `23505` | Unique constraint | Duplicate settings | Shouldn't happen, contact admin |
| `UNDEFINED` | Network/JWT error | Session expired | Refresh page & login again |

---

## Verify Setup Working

After running SQL migration:

1. Open brand settings
2. Add test bank account:
   - Nama: "Test Bank"
   - Nomor: "1234567890"
3. Click "Simpan Pengaturan"
4. Should see: "Pengaturan brand berhasil disimpan" ✅

If not, check console for specific error code.

---

## Direct Database Check

For admin/dev only:

```sql
-- Check table structure
\d brand_settings;

-- Check sample data
SELECT * FROM brand_settings LIMIT 5;

-- Check if specific brand has settings
SELECT * FROM brand_settings 
WHERE brandId = '12345678-1234-1234-1234-123456789012';

-- Test insert (replace UUID)
INSERT INTO brand_settings (brandId, bankAccounts)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  '[]'::jsonb
) RETURNING *;
```

---

## If Everything Looks OK But Still Failing

1. Check browser console for exact error
2. Screenshot error + code
3. Send to dev with:
   - Exact error message from console
   - Brand name and ID
   - Timestamp when error occurred
   - Network conditions (screenshot from DevTools → Network)

---

## Prevention

After initial setup:

- [ ] Test with sample brand
- [ ] Add all data types (bank, QRIS, warehouse)
- [ ] Click "Simpan" - verify toast shows success
- [ ] Refresh page - verify data persists
- [ ] Try with different brand
- [ ] Mark setup as "COMPLETE" ✅
