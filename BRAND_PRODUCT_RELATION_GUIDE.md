# 🔍 Brand-Produk Relationship Check

## Struktur Penyimpanan Data

### Database Schema
```
┌─────────────────────────────────┐
│      brands (Merek)              │
├─────────────────────────────────┤
│ id          │ name              │
│ UUID        │ string            │
│ PRIMARY KEY │ "Nike"            │
└─────────────────────────────────┘
          ↓ (FK)
┌─────────────────────────────────────────┐
│    products (Produk Induk)               │
├─────────────────────────────────────────┤
│ id          │ brand_id    │ name │ status │
│ UUID        │ UUID (FK)   │ str  │ active │
│ PRIMARY KEY │ → brands.id │      │        │
└─────────────────────────────────────────┘
```

### Type Definition
```typescript
interface Form {
  id: string;
  brandId?: string;     // Dipilih user di form
  productId?: string;   // Dipilih dari dropdown produk
}

interface Product {
  id: string;
  brandId: string;      // HARUS cocok dengan form.brandId
  name: string;
  status: 'active' | 'draft' | 'inactive';
}
```

---

## Filtering Logic

### Di FormEditorPage.tsx (Line 1717)
```typescript
{products
    .filter(product => 
        !form.brandId ||                           // Jika brand belum dipilih: tampilkan semua
        product.brandId === form.brandId           // Jika sudah: tampilkan hanya yang cocok
    )
    .map(product => (
        <option key={product.id} value={product.id}>
            {product.name}
        </option>
    ))
}
```

### Contoh Scenario

**Scenario 1: Brand belum dipilih**
```
form.brandId = undefined (atau null)

Filter: !form.brandId === true
Hasil: Tampilkan SEMUA produk (jika ada)
```

**Scenario 2: Brand sudah dipilih**
```
form.brandId = "nike-123"

Filter: product.brandId === "nike-123"
Hasil: Tampilkan hanya produk dengan brand_id = "nike-123"

Jika tidak ada produk cocok → Dropdown kosong
```

---

## Checklist untuk Debug

### ✅ Data Existence
- [ ] Brand sudah ada di Supabase: `SELECT COUNT(*) FROM brands`
- [ ] Produk sudah ada: `SELECT COUNT(*) FROM products`
- [ ] Produk ada untuk brand: `SELECT COUNT(*) FROM products WHERE brand_id = 'BRAND_ID'`

### ✅ Data Status
- [ ] Produk status = 'active': `SELECT COUNT(*) FROM products WHERE status = 'active'`
- [ ] Tidak ada orphaned products: `SELECT * FROM products WHERE brand_id NOT IN (SELECT id FROM brands)`

### ✅ ID Matching
- [ ] Saat membuat produk di ProductsPage: brand yang dipilih
- [ ] Saat membuat form di FormEditorPage: brand yang dipilih
- [ ] Cek: `product.brand_id === form.brand_id` harus TRUE agar tampil di dropdown

### ✅ Code Logic
- [ ] Browser console F12: Lihat log "All products fetched: X"
- [ ] Cek Chrome DevTools Network: Ada error saat fetch?
- [ ] Refresh halaman setelah membuat produk baru

---

## Quick Diagnostic Queries

**Jalankan ini untuk menemukan masalah:**

```sql
-- 1. Ada brand?
SELECT COUNT(*) FROM brands;

-- 2. Ada produk?
SELECT COUNT(*) FROM products;

-- 3. Produk dengan status 'active'?
SELECT COUNT(*) FROM products WHERE status = 'active';

-- 4. Produk aktif per brand
SELECT 
  COALESCE(b.name, 'NO_BRAND') as brand,
  COUNT(p.id) as count
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.status = 'active'
GROUP BY b.id, b.name;

-- 5. Lihat detail 10 produk terakhir
SELECT 
  p.id, p.name, p.brand_id, b.name as brand, p.status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## Masalah yang Paling Umum

### 1. Produk Ada, Tapi Dropdown Tetap Kosong ❌
**Penyebab:** Produk.brand_id ≠ Form.brandId

**Debug:**
```sql
SELECT 
  p.name as product_name,
  p.brand_id as product_brand_id,
  b.name as brand_name
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LIMIT 5;
```
Pastikan `product_brand_id` cocok dengan brand yang Anda pilih di form.

### 2. Console: "All products fetched: 0" ❌
**Penyebab:** Tidak ada produk dengan status='active'

**Fix:**
```sql
UPDATE products SET status = 'active' WHERE status != 'active';
```

### 3. Dropdown Kosong Bahkan Sebelum Memilih Brand ❌
**Penyebab:** `getAllProducts()` gagal atau tidak ada produk sama sekali

**Debug:**
```sql
SELECT COUNT(*) as total FROM products;
SELECT COUNT(*) as active FROM products WHERE status = 'active';
```

---

## File Referensi

| File | Fungsi |
|------|--------|
| `BRAND_PRODUCT_DIAGNOSTIC.sql` | Copy-paste queries untuk check |
| `CHECK_BRAND_PRODUCT_RELATION.sql` | Queries untuk verify relasi |
| `DEBUG_INDUK_PRODUK_KOSONG.md` | Panduan lengkap |
| `pages/FormEditorPage.tsx:1717` | Filtering logic |
| `services/productService.ts:52` | getAllProducts() method |
| `types.ts:286` | Form interface |
| `types.ts:496` | Product interface |

---

## Next Steps

1. **Buka** `BRAND_PRODUCT_DIAGNOSTIC.sql`
2. **Copy-paste Query 1** → Run di Supabase SQL Editor
3. **Copy-paste Query 3** → Run untuk lihat summary
4. **Bagikan hasil** bersama dengan:
   - Brand name yang Anda pilih di form
   - Produk name yang Anda buat
   - Output dari Query 3 (summary produk per brand)
