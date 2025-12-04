# 📋 Summary: Brand-Product Relationship

## Problem
Dropdown "Induk Produk" di Form Editor kosong, bahkan setelah memilih brand.

## Root Cause Checklist

| No | Penyebab | Cek | Cara Cek | Fix |
|----|---------|----|----------|-----|
| 1 | Belum ada brand | `SELECT COUNT(*) FROM brands` | Harusnya > 0 | Buat di "Manajemen Merek" |
| 2 | Belum ada produk | `SELECT COUNT(*) FROM products` | Harusnya > 0 | Buat di "Produk Induk" |
| 3 | Produk status ≠ active | `SELECT COUNT(*) FROM products WHERE status='active'` | Harusnya > 0 | `UPDATE products SET status='active'` |
| 4 | Brand-produk tidak match | `SELECT p.brand_id, b.name FROM products p LEFT JOIN brands b` | product.brand_id harus cocok dengan form.brandId | Update product.brand_id ke brand yang benar |

## Data Structure

```
Brands Table
├─ id (UUID)
├─ name

Products Table
├─ id (UUID)
├─ brand_id (UUID) → FK ke brands.id ← **PENTING!**
├─ name
├─ status ('active' | 'draft' | 'inactive')

Form (dalam FormEditorPage)
├─ brandId → dipilih user
├─ productId → filtered berdasarkan brandId
```

## Filtering Logic
```
IF form.brandId dipilih:
  → Tampilkan hanya: products WHERE product.brandId === form.brandId
ELSE:
  → Tampilkan semua produk (atau kosong jika tidak ada)
```

## Quick Diagnostic

**Jalankan 1 query ini di Supabase SQL Editor:**

```sql
SELECT 
  b.id,
  b.name as brand_name,
  COUNT(p.id) as total_products,
  COUNT(CASE WHEN p.status='active' THEN 1 END) as active_products
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id
GROUP BY b.id, b.name
ORDER BY active_products DESC;
```

**Hasil yang diharapkan:**
- Minimal 1 brand dengan `active_products > 0`

## Files to Reference

| Nama File | Tujuan |
|-----------|--------|
| `INDUK_PRODUK_QUICK_FIX.md` | ⭐ START HERE - Quick fixes & checklist |
| `BRAND_PRODUCT_DIAGNOSTIC.sql` | Copy-paste SQL queries untuk check |
| `DEBUG_INDUK_PRODUK_KOSONG.md` | Detailed troubleshooting guide |
| `BRAND_PRODUCT_RELATION_GUIDE.md` | Schema & logic explanation |
| `CHECK_BRAND_PRODUCT_RELATION.sql` | Alternate SQL queries |

## Code Locations

- **Filtering logic**: `pages/FormEditorPage.tsx:1717`
  ```typescript
  .filter(product => !form.brandId || product.brandId === form.brandId)
  ```

- **Product fetch**: `services/productService.ts:52` (getAllProducts)

- **Type definitions**: 
  - `types.ts:286` (Form)
  - `types.ts:496` (Product)

## Next Steps

1. Open `INDUK_PRODUK_QUICK_FIX.md` → Follow STEP 1-5
2. If still issues → Run query from `BRAND_PRODUCT_DIAGNOSTIC.sql`
3. If still stuck → Share query results + brand/product names

---

**Status**: ✅ Ready to debug
**Last Updated**: December 4, 2025
