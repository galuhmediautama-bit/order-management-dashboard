# Troubleshooting: Produk Tidak Muncul di Dropdown Formulir

## Masalah
- ✅ Brand ada di Pengaturan → Merek
- ✅ Produk ada di menu Produk Induk
- ✅ Form editor bisa pilih brand
- ❌ Produk tidak muncul di dropdown setelah pilih brand

## Kemungkinan Penyebab

### 1. Foreign Key Salah (products.brand_id → users.id seharusnya → brands.id)
**File:** `supabase_products_table.sql` line 4
```sql
-- SALAH:
brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE

-- BENAR:
brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
```

### 2. RLS Policy Memblokir Query
Products table mungkin memiliki RLS yang membatasi akses

### 3. Data Tidak Konsisten
brand_id di products tidak match dengan id di brands

## Langkah Troubleshooting

### Step 1: Cek Browser Console
1. Buka Form Editor (Formulir → Buat Formulir Baru)
2. Tekan F12 untuk buka DevTools
3. Pilih tab Console
4. Pilih brand dari dropdown
5. Cari log:
   ```
   Brand changed to: [uuid]
   Total products available: [number]
   Products for this brand: [number]
   ```

**Jika "Total products available: 0"** → Products tidak ter-load sama sekali
**Jika "Products for this brand: 0"** → brandId tidak match

### Step 2: Jalankan Diagnostic SQL
Jalankan di Supabase SQL Editor: `debug_products_brands.sql`

**Query penting:**
```sql
-- Cek apakah products punya brand yang valid
SELECT 
    p.id,
    p.name as product_name,
    p.brand_id,
    b.name as brand_name,
    CASE 
        WHEN b.id IS NULL THEN 'ORPHANED'
        ELSE 'OK'
    END as status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id;
```

### Step 3: Cek Foreign Key
Jalankan: `fix_products_brand_foreign_key.sql` Step 1-2

```sql
-- Cek constraint yang ada
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'products' AND column_name = 'brand_id';
```

### Step 4: Cek RLS Policies
Jalankan: `check_rls_policies.sql`

```sql
-- Cek apakah RLS aktif
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'products';

-- Lihat policies
SELECT policyname, cmd, qual::text 
FROM pg_policies 
WHERE tablename = 'products';
```

## Solusi Berdasarkan Penyebab

### Solusi 1: Fix Foreign Key (Jika FK salah)
```sql
-- 1. Drop old FK
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_brand_id_fkey;

-- 2. Add correct FK
ALTER TABLE products
ADD CONSTRAINT products_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES brands(id)
ON DELETE CASCADE;
```

### Solusi 2: Add RLS Policy (Jika RLS memblokir)
```sql
-- Allow authenticated users to view products
CREATE POLICY "view_products" ON products
    FOR SELECT
    TO authenticated
    USING (true);
```

### Solusi 3: Fix Data (Jika brand_id tidak match)
```sql
-- Cek data yang bermasalah
SELECT p.id, p.name, p.brand_id
FROM products p
WHERE p.brand_id NOT IN (SELECT id FROM brands);

-- Option A: Update ke brand yang valid
UPDATE products 
SET brand_id = (SELECT id FROM brands LIMIT 1)
WHERE brand_id NOT IN (SELECT id FROM brands);

-- Option B: Create missing brands
INSERT INTO brands (id, name, status)
SELECT DISTINCT p.brand_id, 'Brand ' || LEFT(p.brand_id::text, 8), 'active'
FROM products p
WHERE p.brand_id NOT IN (SELECT id FROM brands);
```

### Solusi 4: Recheck ProductService Query
File: `services/productService.ts`

Pastikan query menggunakan `eq('status', 'active')`:
```typescript
async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')  // ← Pastikan ini ada
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformProduct);
}
```

## Quick Fix Script

Jalankan di Supabase SQL Editor:
```sql
-- 1. Check current state
SELECT 
    'Products' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active
FROM products
UNION ALL
SELECT 
    'Brands',
    COUNT(*),
    COUNT(CASE WHEN status = 'active' THEN 1 END)
FROM brands;

-- 2. Check products with brands
SELECT 
    p.id,
    p.name,
    p.brand_id,
    b.name as brand_name,
    p.status
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.status = 'active';

-- 3. If empty, check if products exist at all
SELECT COUNT(*) FROM products;

-- 4. If products exist but brand_id is wrong type, check column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name IN ('id', 'brand_id');
```

## Expected Result

Setelah perbaikan, console log harus menampilkan:
```
Products loaded: [number > 0] products
Sample product: {id: "...", brandId: "...", name: "..."}
Unique brand IDs in products: ["uuid1", "uuid2", ...]

Brand changed to: uuid1
Total products available: [number]
Products for this brand: [number > 0]
Sample matching product: {id: "...", brandId: "uuid1", ...}
```

## Jika Masih Bermasalah

1. Screenshot console log (F12 → Console)
2. Screenshot hasil query `debug_products_brands.sql` Query #2
3. Screenshot hasil query `check_rls_policies.sql` Query #7
4. Paste error message (jika ada)

---

## Files untuk Troubleshooting
- `debug_products_brands.sql` - Diagnostic queries
- `fix_products_brand_foreign_key.sql` - Fix FK constraint
- `check_rls_policies.sql` - Check RLS policies
- `TROUBLESHOOT_PRODUCTS_DROPDOWN.md` - This file
