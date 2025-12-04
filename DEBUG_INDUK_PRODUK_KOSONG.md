# Debug: Induk Produk Dropdown Kosong

## Masalah
Dropdown "Induk Produk" tidak menampilkan pilihan bahkan setelah memilih brand.

## Penyebab Root Cause

Ada 3 kemungkinan:

### 1️⃣ Tidak Ada Produk Untuk Brand yang Dipilih
**Gejala:**
- Pilih brand → Dropdown produk tetap kosong
- Pesan: "⚠️ Tidak ada produk untuk merek yang dipilih"

**Solusi:**
- Buat produk di menu **Produk Induk**
- Pastikan saat membuat produk, pilih brand yang SAMA dengan brand yang dipilih di form
- Refresh halaman

### 2️⃣ Brand ID Tidak Cocok (Mismatch)
**Gejala:**
- Produk ada (terlihat di menu Produk Induk)
- Tapi tidak muncul di dropdown form

**Root Cause:**
```
Form.brandId     = "abc123"  (UUID dari brands table)
Produk.brandId   = "abc123"  (harus cocok)

Jika tidak cocok → Filter tidak menampilkan produk
```

**Solusi:**
1. Buka Supabase SQL Editor
2. Jalankan query di bawah ini:

```sql
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.brand_id as product_brand_id,
  b.name as brand_name
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC
LIMIT 20;
```

3. Periksa apakah `product_brand_id` cocok dengan brand yang Anda pilih di form

### 3️⃣ Produk Ada Tapi Status ≠ 'active'
**Gejala:**
- Console log: "All products fetched: 0" atau "All products fetched: X" tapi dropdown tetap kosong

**Root Cause:**
```
Query: SELECT * FROM products WHERE status = 'active'
Jika produk dibuat dengan status 'draft' atau 'inactive' → tidak ditampilkan
```

**Solusi:**
```sql
-- Update semua produk jadi 'active'
UPDATE products SET status = 'active' WHERE status != 'active';

-- Verify
SELECT COUNT(*) FROM products WHERE status = 'active';
```

---

## Step-by-Step Debug

### LANGKAH 1: Cek Browser Console

1. Buka Form Editor
2. Press **F12** → Tab **Console**
3. Pilih brand dari dropdown
4. Lihat logs:
   - ✅ "All products fetched: 5" → ada 5 produk
   - ❌ "All products fetched: 0" → tidak ada produk untuk brand ini
   - ❌ Error message → ada masalah query

### LANGKAH 2: Verifikasi Data di Supabase

**Query A: Cek semua brand**
```sql
SELECT id, name FROM brands LIMIT 10;
```
Catat ID brand yang ingin Anda test.

**Query B: Cek produk untuk brand tersebut**
```sql
-- Ganti 'BRAND_ID_HERE' dengan ID dari Query A
SELECT id, name, brand_id, status FROM products 
WHERE brand_id = 'BRAND_ID_HERE';
```

**Hasil yang diharapkan:**
- Jika Query B kosong → Tidak ada produk untuk brand ini (buat produk baru)
- Jika Query B ada data tapi status ≠ 'active' → Update status ke 'active'
- Jika Query B ada data dengan status = 'active' → Ada bug di code filter

### LANGKAH 3: Cek Skema Penyimpanan Brand-Produk

**Struktur yang benar:**
```
brands table
├─ id: UUID (primary key)
├─ name: string
└─ ...

products table
├─ id: UUID (primary key)
├─ brand_id: UUID (foreign key → brands.id) ← PENTING!
├─ name: string
├─ status: 'active' | 'draft' | 'inactive'
└─ ...
```

**Verifikasi dengan query:**
```sql
-- Lihat struktur products table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

Pastikan ada kolom `brand_id` dengan tipe UUID.

### LANGKAH 4: Cek Filtering Logic

**Location:** `pages/FormEditorPage.tsx` line ~1717

**Kode:**
```typescript
{products
    .filter(product => !form.brandId || product.brandId === form.brandId)
    .map(product => (
        <option key={product.id} value={product.id}>
            {product.name}
        </option>
    ))
}
```

**Penjelasan:**
- Jika `!form.brandId` → tampilkan SEMUA produk
- Jika `form.brandId` dipilih → tampilkan hanya produk dengan `product.brandId === form.brandId`

**Debug Filter:**
1. Buka browser Developer Tools (F12)
2. Console:
```javascript
// Copy-paste ini di console:
console.log('Current form.brandId:', window.formBrandId); // Akan undefined, ini hanya contoh
console.log('All products:', window.products); // Akan undefined, ini hanya contoh
```

---

## Testing Checklist

- [ ] Brand sudah dibuat: Menu **Manajemen Merek** → Buat/lihat brand
- [ ] Produk sudah dibuat: Menu **Produk Induk** → Buat produk untuk brand tersebut
- [ ] Product.brand_id cocok dengan Form.brandId (jalankan SQL query di atas)
- [ ] Produk status = 'active' (bukan 'draft' atau 'inactive')
- [ ] Browser console tidak ada error (F12 → Console tab)
- [ ] Refresh page setelah membuat produk baru

---

## Solusi Cepat Jika Masih Kosong

Jalankan query ini di Supabase SQL Editor:

```sql
-- DIAGNOSTIK LENGKAP
-- Tampilkan semua info yang dibutuhkan

-- 1. Total produk
SELECT COUNT(*) as total_products FROM products;

-- 2. Produk aktif per brand
SELECT 
  b.id,
  b.name as brand_name,
  COUNT(p.id) as active_products
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
GROUP BY b.id, b.name
ORDER BY active_products DESC;

-- 3. Semua produk dengan brand info
SELECT 
  p.id,
  p.name,
  p.brand_id,
  b.name as brand_name,
  p.status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 4. Produk dengan status bukan 'active' (perlu update)
SELECT COUNT(*) as non_active_products FROM products WHERE status != 'active';
```

---

## Lokasi Kode Penting

| File | Baris | Fungsi |
|------|-------|--------|
| `pages/FormEditorPage.tsx` | 930-965 | Fetch produk saat halaman load |
| `pages/FormEditorPage.tsx` | 1670-1730 | Dropdown merek dan induk produk |
| `services/productService.ts` | 52-75 | getAllProducts() & getProductsByBrand() |
| `types.ts` | 286-350 | Interface Form dengan brandId dan productId |
| `types.ts` | 496-560 | Interface Product dengan brandId |

---

## Brand-Produk Schema

### Database (Supabase)
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP
);

CREATE TABLE products (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),  ← PENTING!
  name TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP
);
```

### Type Definition
```typescript
interface Form {
  brandId?: string;      // FK ke brands table
  productId?: string;    // FK ke products table
}

interface Product {
  brandId: string;       // FK ke brands table
  name: string;
  status: 'active' | 'draft' | 'inactive';
}
```

---

## Jika Masih Tidak Bisa

Bagikan:
1. Screenshot konsol (F12 → Console) saat membuka Form Editor
2. Hasil Query di atas:
```sql
SELECT 
  b.id as brand_id,
  b.name,
  COUNT(p.id) as product_count
FROM brands b
LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
GROUP BY b.id, b.name;
```
3. Brand name yang Anda pilih di form
