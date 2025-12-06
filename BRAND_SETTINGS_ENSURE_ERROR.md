# Brand Settings - Error: "Gagal menyiapkan pengaturan brand"

## Apa Masalahnya?

Ketika user klik "Simpan Pengaturan", aplikasi menunjukkan error:
```
Gagal menyiapkan pengaturan brand. Cek console untuk detail error.
```

Ini berarti sistem gagal membuat/mengakses record pengaturan untuk brand tersebut.

---

## Diagnosis Steps

### Step 1: Buka Console (F12)

1. Buka aplikasi di browser
2. Tekan **F12** untuk buka Developer Tools
3. Pilih tab **Console**
4. Klik "Simpan Pengaturan" lagi
5. Lihat pesan error di console

### Step 2: Cari Log Sequence

Carilah sequence seperti ini:

```javascript
ensureBrandSettings: Checking settings for brandId: <uuid-here>
ensureBrandSettings: Checking settings for brandId: 12345-67890-...

// Jika BERHASIL:
Check error code: PGRST116
No settings found, creating new...
Inserting new settings: {brandId, bankAccounts: [], ...}
✓ Created brand settings: <id-here>

// Jika GAGAL:
Error creating brand settings: {
  code: '23503',
  message: 'insert or update on table "brand_settings" violates foreign key constraint ...'
}
```

### Step 3: Identifikasi Error Code

Cari `code:` di error object. Common codes:

| Code | Meaning | Solution |
|------|---------|----------|
| `PGRST116` | Table not found | Run SQL migration |
| `42P01` | Table doesn't exist | Run SQL migration |
| `PGRST201` | Permission denied | Check RLS policies |
| `23503` | Foreign key violation | Check brands table |
| `23505` | Unique constraint | Unique constraint error |
| timeout | Network timeout | Check connection |

---

## Solutions by Error Code

### 🔴 Code: PGRST116 / 42P01 (Table not found)

**Problem:** `brand_settings` table tidak ada

**Solution:**
1. Buka Supabase Dashboard
2. Go to SQL Editor
3. Copy-paste SQL dari `BRAND_SETTINGS_SETUP.md`
4. Run query
5. Refresh aplikasi

**Verify:**
```sql
SELECT * FROM public.brand_settings LIMIT 1;
-- Harus tidak error (bisa empty, tapi table exist)
```

---

### 🔴 Code: PGRST201 (Permission denied)

**Problem:** User tidak punya permission mengakses/modify table

**Solution:**
1. Cek Supabase RLS policies
2. Go to: Table Editor → brand_settings → Policies
3. Pastikan ada policy untuk authenticated users
4. Jika tidak ada, run SQL migration ulang

**Verify:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'brand_settings';
-- Harus ada minimal 1 policy
```

---

### 🔴 Code: 23503 (Foreign key violation)

**Problem:** `brandId` tidak ada di `brands` table

**Solution:**

Ini terjadi ketika:
- Brand sudah dihapus tapi modal masih terbuka
- UUID invalid
- Brand tidak terdaftar di database

**What to do:**
1. Refresh page
2. Buka brand yang berbeda
3. Coba lagi

**Verify:**
```sql
SELECT id, name FROM brands 
WHERE id = 'PUT_BRAND_ID_HERE';
-- Harus return 1 row
```

---

### 🔴 Code: 23505 (Unique constraint)

**Problem:** Settings untuk brand ini sudah ada

**Solution:**
1. Cek apakah brand sudah punya settings
2. Delete existing settings (admin only)
3. Refresh page

**Verify:**
```sql
SELECT * FROM brand_settings 
WHERE brandId = 'PUT_BRAND_ID_HERE';
-- Harus return 0 atau 1 row
```

---

## Advanced Debugging

### Check Table Structure

```sql
-- Lihat kolom dan tipe data
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'brand_settings'
ORDER BY ordinal_position;
```

Expected output:
```
column_name      | data_type | is_nullable
-----------------+-----------+------------
id               | uuid      | NO
brandId          | uuid      | NO (UNIQUE)
bankAccounts     | jsonb     | YES
qrisPayments     | jsonb     | YES
warehouses       | jsonb     | YES
createdAt        | timestamp | YES
updatedAt        | timestamp | YES
```

### Check Foreign Keys

```sql
-- Cek foreign key constraint
SELECT constraint_name, table_name, column_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'brand_settings';
```

Should show:
```
constraint_name                  | table_name     | column_name
---------------------------------+----------------+------------
brand_settings_brandid_fkey      | brands         | id
```

### Test Insert Manually

```sql
-- Test insert (replace with real brand UUID)
INSERT INTO brand_settings (brandId, bankAccounts, qrisPayments, warehouses)
VALUES (
    '12345678-1234-1234-1234-123456789012',
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb
)
RETURNING *;
```

If error:
- Copy error message
- Check if brandId exists: `SELECT id FROM brands WHERE id = '...'`
- Check if settings already exist: `SELECT * FROM brand_settings WHERE brandId = '...'`

---

## Quick Checklist

- [ ] Table `brand_settings` exists?
  ```sql
  SELECT to_regclass('public.brand_settings');
  -- harus NOT NULL
  ```

- [ ] RLS enabled dan policy ada?
  ```sql
  SELECT tablename, policyname FROM pg_policies 
  WHERE tablename = 'brand_settings';
  ```

- [ ] Foreign key constraint ada?
  ```sql
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'brand_settings' AND constraint_type = 'FOREIGN KEY';
  ```

- [ ] Brand exists di brands table?
  ```sql
  SELECT id FROM brands WHERE id = '<put-brand-id>';
  ```

- [ ] No existing settings untuk brand?
  ```sql
  SELECT id FROM brand_settings WHERE brandId = '<put-brand-id>';
  ```

---

## Console Logging Reference

Setiap attempt akan log messages:

```javascript
// Start
ensureBrandSettings: Checking settings for brandId: [uuid]

// Success path
Check error code: PGRST116
No settings found, creating new...
Inserting new settings: {brandId, ...}
✓ Created brand settings: [id]

// Error path
Error creating brand settings: {
  code: '[ERROR_CODE]',
  message: '[MESSAGE]',
  details: '[DETAILS]'
}

ensureBrandSettings exception: [ERROR]
```

Screenshot console logs dan kirim untuk debugging.

---

## Still Stuck?

1. Collect:
   - Screenshot of error message
   - Full console log output
   - Brand ID (dari console atau table)
   - Supabase Project URL

2. Run diagnostic SQL:
   ```sql
   -- Cek table existence
   SELECT to_regclass('public.brand_settings') as table_status;
   
   -- Cek RLS policies
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'brand_settings';
   
   -- Cek specific brand
   SELECT * FROM brands WHERE id = 'BRAND_UUID';
   SELECT * FROM brand_settings WHERE brandId = 'BRAND_UUID';
   ```

3. Send:
   - Error message
   - Console logs
   - SQL diagnostic results
   - To: support@[domain]
