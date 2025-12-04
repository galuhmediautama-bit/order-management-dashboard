# 🎯 Visual Checklist: Brand-Product Diagnosis

## FLOWCHART: Why Dropdown is Empty?

```
┌─────────────────────────────────────┐
│ Dropdown "Induk Produk" Kosong      │
└──────────────┬──────────────────────┘
               │
               ├─ CHECK 1: Ada Brand? ──────────────┐
               │                                     │
               ├─ CHECK 2: Ada Produk Aktif? ────────┼─────────┐
               │                                     │         │
               ├─ CHECK 3: Brand-Produk Cocok? ─────┼────┐    │
               │                                     │    │    │
               └─ CHECK 4: Form Brand Dipilih? ────┼────┼────┐
                                                    │    │    │

❌ CHECK 1 FAIL                    ✅ CHECK 1 OK
   └─ Buat brand terlebih dahulu        └─ NEXT: CHECK 2
```

---

## CHECK LIST (Do These Steps)

### ☑️ CHECK 1: Ada Brand?

**Di Supabase SQL Editor:**
```sql
SELECT COUNT(*) as brand_count FROM brands;
```

| Hasil | Status | Action |
|-------|--------|--------|
| 0 | ❌ FAIL | Buat brand di "Manajemen Merek" |
| ≥ 1 | ✅ OK | NEXT: CHECK 2 |

**Jika FAIL:**
```
Menu → Manajemen Merek → Tambah Brand
Isi nama brand
Save
```

---

### ☑️ CHECK 2: Ada Produk Aktif?

**Di Supabase SQL Editor:**
```sql
SELECT COUNT(*) as active_count FROM products WHERE status = 'active';
```

| Hasil | Status | Action |
|-------|--------|--------|
| 0 | ❌ FAIL | Buat produk atau update status |
| ≥ 1 | ✅ OK | NEXT: CHECK 3 |

**Jika FAIL (0 aktif):**

**Option A: Buat Produk Baru**
```
Menu → Produk Induk → Tambah Produk
Isi form semua
Status: Active (default)
PENTING: Pilih Brand dari dropdown
Save
```

**Option B: Update Status Existing**
```sql
UPDATE products SET status = 'active' WHERE status != 'active';
```

---

### ☑️ CHECK 3: Brand-Produk Matching?

**Di Supabase SQL Editor:**
```sql
-- Cek apakah product.brand_id punya value dan cocok
SELECT 
  p.id,
  p.name,
  p.brand_id,
  b.name as brand_name,
  CASE 
    WHEN p.brand_id IS NULL THEN 'NULL'
    WHEN b.id IS NULL THEN 'ORPHANED'
    ELSE 'OK'
  END as status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.status = 'active';
```

**Analisa Results:**

| Scenario | Status | Action |
|----------|--------|--------|
| Semua status = 'OK' | ✅ GOOD | NEXT: CHECK 4 |
| Ada 'NULL' brand_id | ❌ BAD | Fix: `UPDATE products SET brand_id = 'BRAND_ID_HERE'` |
| Ada 'ORPHANED' | ❌ BAD | Delete atau fix brand_id |

**Jika Ada NULL:**
```sql
-- Lihat produk dengan NULL brand_id
SELECT id, name FROM products WHERE brand_id IS NULL;

-- Update ke brand yang benar (ganti BRAND_ID)
UPDATE products SET brand_id = 'BRAND_ID_FROM_CHECK1' WHERE brand_id IS NULL;

-- Verify
SELECT COUNT(*) FROM products WHERE brand_id IS NULL;
-- Harusnya: 0
```

---

### ☑️ CHECK 4: Form Brand Dipilih?

**Di Browser:**
```
1. Buka Form Editor
2. Lihat field "Merek" 
3. Apakah sudah dipilih? (bukan "Tidak ada merek")
```

| Situasi | Action |
|---------|--------|
| Belum dipilih | Pilih brand dari dropdown |
| Sudah dipilih | NEXT: CHECK 5 |

---

### ☑️ CHECK 5: Test Dropdown

**Di Browser:**
```
1. Pilih brand dari "Merek" dropdown
2. Lihat dropdown "Induk Produk"
3. Apakah ada pilihan?
```

| Hasil | Status | Action |
|-------|--------|--------|
| Ada pilihan | ✅ SUCCESS | Pilih produk & save |
| Masih kosong | ❌ FAIL | CHECK 6 |

---

### ☑️ CHECK 6: Browser Console

**Di Browser:**
```
1. Press F12 → Console tab
2. Refresh halaman
3. Cari message:
   - "All products fetched: X"
   - atau error message
```

| Log Message | Arti | Action |
|-------------|------|--------|
| "All products fetched: 5" | Ada 5 produk | Filter UI bug → Check code |
| "All products fetched: 0" | Tidak ada produk | Go back CHECK 2 & 3 |
| "Error: ..." | Query error | Check RLS policies |

---

## QUICK REFERENCE TABLE

| Problem | Root Cause | Check | Fix |
|---------|-----------|-------|-----|
| Dropdown kosong | No brands | CHECK 1 | Create brand |
| Dropdown kosong | No active products | CHECK 2 | Create product or update status |
| Dropdown kosong | Brand_id mismatch | CHECK 3 | UPDATE brand_id |
| Dropdown kosong | Brand not selected in form | CHECK 4 | Select brand in form |
| Dropdown kosong | UI/filter bug | CHECK 6 | Check console, refresh |

---

## DECISION TREE

```
START
  │
  ├─→ Any brand created?
  │   ├─ NO → Create in "Manajemen Merek"
  │   └─ YES ↓
  │
  ├─→ Any active product?
  │   ├─ NO → Create in "Produk Induk" (select brand!)
  │   └─ YES ↓
  │
  ├─→ Product brand_id matches database brand?
  │   ├─ NO → UPDATE products SET brand_id = correct_id
  │   └─ YES ↓
  │
  ├─→ Form has brand selected?
  │   ├─ NO → Select brand from form dropdown
  │   └─ YES ↓
  │
  ├─→ Browser console shows products fetched?
  │   ├─ YES, 0 → No matching products (go back step 3)
  │   ├─ YES, >0 → UI bug? Refresh or clear cache
  │   └─ ERROR → Check RLS / query permissions
  │
  └─→ ✅ FIXED! Dropdown should show products
```

---

## ONE-LINER DIAGNOSTICS

**Copy-paste salah satu dari Supabase SQL Editor:**

```sql
-- 1. Count everything
SELECT 
  'Brands' as entity,
  COUNT(*) FROM brands
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Active Products', COUNT(*) FROM products WHERE status='active';

-- 2. Brand-Product Summary
SELECT b.name, COUNT(p.id) as count
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id AND p.status='active'
GROUP BY b.id, b.name;

-- 3. Find problems
SELECT 'Orphaned Products' as issue, COUNT(*) FROM products WHERE brand_id NOT IN (SELECT id FROM brands)
UNION ALL
SELECT 'NULL brand_id', COUNT(*) FROM products WHERE brand_id IS NULL
UNION ALL
SELECT 'Inactive Products', COUNT(*) FROM products WHERE status != 'active';

-- 4. Show all product details
SELECT p.id, p.name, p.brand_id, b.name as brand, p.status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC
LIMIT 20;
```

---

## SUCCESS INDICATORS ✅

After all checks pass:

- [ ] Browser console shows: "All products fetched: X" (X > 0)
- [ ] Dropdown "Induk Produk" shows product list when brand selected
- [ ] Can select product
- [ ] Can save form
- [ ] No error messages (F12 Console)

---

## RESET IF BROKEN

If database is messed up, run:

```sql
-- 1. List all problems
SELECT 'Brands' as entity, COUNT(*) FROM brands
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Orphaned products', COUNT(*) FROM products WHERE brand_id NOT IN (SELECT id FROM brands)
UNION ALL
SELECT 'NULL brand_id', COUNT(*) FROM products WHERE brand_id IS NULL;

-- 2. Fix orphaned (DELETE or UPDATE)
DELETE FROM products WHERE brand_id NOT IN (SELECT id FROM brands);
-- OR
UPDATE products SET brand_id = (SELECT id FROM brands LIMIT 1) WHERE brand_id IS NULL;

-- 3. Ensure all active
UPDATE products SET status = 'active';

-- 4. Verify
SELECT COUNT(*) as active_products FROM products WHERE status='active' AND brand_id IN (SELECT id FROM brands);
```

---

## FINAL TEST

1. **Create Brand**: "TestBrand" → Get ID
2. **Create Product**: "TestProduct" → brand_id = above ID, status = 'active'
3. **Create Form**: brand = "TestBrand"
4. **Check Dropdown**: Should show "TestProduct"
5. **Success**: ✅

---

**Last Updated**: December 4, 2025
**Document Type**: Diagnostic Checklist
