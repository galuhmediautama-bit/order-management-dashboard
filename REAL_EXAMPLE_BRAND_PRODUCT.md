# 🎯 Real Example: Brand → Product Setup

## Scenario: Anda ingin setup Produk "Sepatu Nike" untuk Brand "Nike"

### Step 1: Create Brand "Nike"
**Location:** Menu → Manajemen Merek → Tambah Brand

```
Brand Name: Nike
```

**Hasil di Database:**
```sql
brands table:
┌─────────────────────────────────────┬────────┐
│ id                                   │ name   │
├─────────────────────────────────────┼────────┤
│ b001-nike-uuid-here-1234567890abc   │ Nike   │
└─────────────────────────────────────┴────────┘
```

---

### Step 2: Create Produk "Sepatu Nike"
**Location:** Menu → Produk Induk → Tambah Produk

```
Nama Produk: Sepatu Nike Air
Merek: Nike ← **PENTING: Pilih brand dari dropdown**
Kategori: Footwear
Harga: 500000
SKU: NIKE-001
Status: Active
```

**Hasil di Database:**
```sql
products table:
┌─────────────────────────────────────┬──────────────────────────────┬──────┐
│ id                                   │ brand_id                      │ name │
├─────────────────────────────────────┼──────────────────────────────┼──────┤
│ p001-produk-uuid-here-1234567890abc │ b001-nike-uuid-here-123...   │ Se.. │
└─────────────────────────────────────┴──────────────────────────────┴──────┘

⬆️ PENTING: brand_id HARUS SAMA dengan Nike id dari Step 1
```

---

### Step 3: Create Form dengan Brand "Nike"
**Location:** Menu → Formulir → Tambah Formulir

```
Nama Formulir: Pre-Order Sepatu Nike
Merek: Nike ← Pilih brand yang sama dari Step 1
Induk Produk: Sepatu Nike Air ← Dropdown akan filter produk Nike
```

**Logika di Code:**
```typescript
form.brandId = "b001-nike-uuid-here-1234567890abc"

// Filter produk
products.filter(p => p.brandId === form.brandId)

// Hasil: Hanya "Sepatu Nike Air" yang ditampilkan
// Produk dari brand lain (Adidas, Puma, dll) tidak ditampilkan
```

---

## Verify di Supabase

```sql
-- 1. Lihat Brand "Nike"
SELECT * FROM brands WHERE name = 'Nike';
-- Output: ID = b001-nike-uuid-here-1234567890abc

-- 2. Lihat Produk "Sepatu Nike Air" dan brand_id-nya
SELECT id, name, brand_id, status 
FROM products 
WHERE name = 'Sepatu Nike Air';
-- Output: 
-- id: p001-produk-uuid-here-1234567890abc
-- brand_id: b001-nike-uuid-here-1234567890abc ← SAMA dengan Nike id
-- status: active

-- 3. Verify filter di Formulir
SELECT * FROM forms WHERE name = 'Pre-Order Sepatu Nike';
-- Output:
-- brand_id: b001-nike-uuid-here-1234567890abc
-- product_id: p001-produk-uuid-here-1234567890abc
```

---

## Apa Kalau Tidak Cocok?

### Scenario A: Brand_id Salah
```
Database:
- brands: Nike id = b001
- products: Sepatu Nike Air → brand_id = b999 (SALAH! Seharusnya b001)
- form: brandId = b001

Hasil: ❌ Dropdown kosong (filter tidak cocok)

Fix:
UPDATE products SET brand_id = 'b001' WHERE id = 'p001';
```

### Scenario B: Produk Belum Ada
```
Database:
- brands: Nike id = b001 (ada)
- products: (kosong, belum ada produk Nike)
- form: brandId = b001

Hasil: ❌ Dropdown kosong (tidak ada data)

Fix:
Buat produk di "Produk Induk" → Pilih brand Nike
```

### Scenario C: Produk Status Salah
```
Database:
- brands: Nike id = b001
- products: Sepatu Nike Air → brand_id = b001 ✓, status = 'draft' ❌
- form: brandId = b001

Hasil: ❌ Dropdown kosong (filter: status = 'active' saja)

Fix:
UPDATE products SET status = 'active' WHERE id = 'p001';
```

### Scenario D: Brand Belum Dipilih di Form
```
Database:
Semua benar ✓

- form: brandId = undefined/null

Hasil: ⚠️ Dropdown akan show SEMUA produk (tidak di-filter)

Solusi: Pilih brand di form → dropdown akan di-filter
```

---

## Testing Checklist

- [ ] Brand "Nike" exist di database
- [ ] Produk "Sepatu Nike Air" exist dengan:
  - [ ] `brand_id` = Nike's id
  - [ ] `status` = 'active' (bukan draft)
- [ ] Form brand_id = Nike's id
- [ ] Refresh browser setelah create produk baru
- [ ] Check browser console (F12) → no errors
- [ ] Dropdown "Induk Produk" show produk Nike saat brand dipilih

---

## Verification Query

Paste ini di Supabase SQL Editor untuk instant check:

```sql
SELECT 
  'Brands' as entity,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ OK'
    ELSE '✗ NO DATA' 
  END as status
FROM brands

UNION ALL

SELECT 
  'Products (Active)',
  COUNT(*),
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ OK'
    ELSE '✗ NO ACTIVE PRODUCTS' 
  END
FROM products
WHERE status = 'active'

UNION ALL

SELECT 
  'Nike Products',
  COUNT(p.id),
  CASE 
    WHEN COUNT(p.id) > 0 THEN '✓ OK'
    ELSE '✗ NO NIKE PRODUCTS' 
  END
FROM products p
JOIN brands b ON p.brand_id = b.id
WHERE b.name = 'Nike' AND p.status = 'active';
```

---

## Summary

| Component | Must Do |
|-----------|---------|
| Brand | Create di Manajemen Merek |
| Product | Create di Produk Induk + pilih brand dari dropdown |
| Product brand_id | MUST match dengan brand id dari brands table |
| Product status | MUST = 'active' |
| Form brand_id | Set ke brand dari dropdown |
| Form product_id | Will filter based on brand_id |

---

**Good Setup:**
```
Nike (brand) → [Sepatu Nike, Jersey Nike] (products with brand_id=Nike)
Adidas (brand) → [Sepak Nike] (products with brand_id=Adidas)

Form with Nike → Dropdown shows: Sepatu Nike, Jersey Nike ✓
Form with Adidas → Dropdown shows: Sepak Adidas ✓
```

**Bad Setup:**
```
Nike (brand id=b001)
Sepatu Nike (product) → brand_id=b999 (MISMATCH!)

Form with Nike → Dropdown empty ✗ (can't find matching products)
```
