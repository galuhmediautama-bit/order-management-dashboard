# Fix: Produk Berhasil Ditambahkan Tapi Tidak Muncul di Daftar

## Masalah
```
✅ Produk berhasil ditambahkan
❌ Produk tidak muncul di halaman daftar produk
```

## Root Cause

Ada 3 kemungkinan penyebab:

### 1. **RLS Policy Terlalu Ketat**
- Policy hanya memungkinkan view produk dengan filter tertentu
- Solusi: Simplify RLS policy

### 2. **Query Filter Tidak Sesuai**
- ProductsPage hanya query produk dengan `brand_id = currentUser.id`
- Tapi produk baru dibuat dengan `brand_id` dari dropdown brands
- Solusi: Update query untuk Super Admin (view semua) dan Admin (view brand mereka)

### 3. **Status Produk Bukan 'active'**
- Produk dibuat dengan status default yang tidak 'active'
- Solusi: Pastikan status 'active' saat create

## Solusi yang Sudah Diterapkan

### 1. Update ProductsPage.tsx
```typescript
const fetchProducts = async () => {
    if (!currentUser?.id) return;
    
    // Super Admin: lihat semua produk
    if (currentUser.role === 'Super Admin') {
        data = await productService.getAllProducts();
    } else {
        // Admin: lihat produk brand mereka
        data = await productService.getProductsByBrand(currentUser.id);
    }
};
```

### 2. Tambah Method di productService.ts
```typescript
async getAllProducts(): Promise<Product[]> {
    return await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
}
```

### 3. Simplify RLS Policy (Recommended)
Jalankan `supabase_setup_products_rls_simple.sql` untuk:
- ✅ Everyone dapat view products
- ✅ Super Admin dapat do everything
- ✅ Admin dapat manage products mereka sendiri

## Steps to Fix

### Step 1: Update RLS Policy (Wajib)

**Option A: Gunakan SQL baru yang simple (RECOMMENDED)**
1. Buka Supabase SQL Editor
2. Copy-paste `supabase_setup_products_rls_simple.sql`
3. Run

**Option B: Manual drop dan recreate**
```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "super_admin_view_products" ON products;
DROP POLICY IF EXISTS "super_admin_insert_products" ON products;
DROP POLICY IF EXISTS "super_admin_update_products" ON products;
DROP POLICY IF EXISTS "super_admin_delete_products" ON products;
DROP POLICY IF EXISTS "admin_view_own_products" ON products;
DROP POLICY IF EXISTS "admin_insert_own_products" ON products;
DROP POLICY IF EXISTS "admin_update_own_products" ON products;
DROP POLICY IF EXISTS "admin_delete_own_products" ON products;
DROP POLICY IF EXISTS "authenticated_view_products" ON products;
DROP POLICY IF EXISTS "advertiser_view_products" ON products;

-- Kemudian copy-paste seluruh isi supabase_setup_products_rls_simple.sql
```

### Step 2: Verifikasi Database
```sql
-- Check RLS status
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'products';

-- Check policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'products';
```

Expected:
- `relrowsecurity = TRUE`
- 3 policies: view_products, super_admin_all, admin_manage_own_products

### Step 3: Refresh Browser & Test

1. Buka http://localhost:3001/#/produk
2. Klik "Tambah Produk"
3. Isi form:
   - Nama: Test Product
   - Brand: (pilih dari dropdown)
   - Kategori: (pilih salah satu)
   - Harga Jual: 100000
4. Klik "Simpan"
5. ✅ Produk harus muncul di daftar

## Expected Behavior

### Jika User adalah Super Admin:
- ✅ Dapat melihat SEMUA produk dari semua brand
- ✅ Dapat edit/delete produk apapun

### Jika User adalah Admin (Brand Owner):
- ✅ Dapat melihat produk brand mereka sendiri
- ✅ Dapat create produk untuk brand mereka
- ✅ Dapat edit/delete produk mereka

### Jika User adalah Lain:
- ✅ Dapat view produk (untuk form display)
- ❌ Tidak dapat create/edit/delete

## Troubleshooting

### Problem 1: Tetap tidak muncul setelah setup
**Solusi:**
1. Cek Console di browser (F12) untuk error message
2. Cek di Supabase Logs untuk RLS error
3. Pastikan `status = 'active'` di SQL:
   ```sql
   SELECT id, name, status FROM products;
   ```

### Problem 2: RLS Error saat create
**Solusi:**
1. Pastikan user sudah login
2. Cek user role di Supabase users table
3. Verify `brand_id` di dropdown adalah valid brand ID dari brands table

### Problem 3: Hanya bisa lihat 1 produk padahal ada lebih banyak
**Solusi:**
Ini berarti RLS policy "super_admin_all" mungkin error. Debug:
```sql
-- Test Super Admin role
SELECT * FROM users WHERE id = 'YOUR_USER_ID';

-- Check products
SELECT * FROM products;

-- Test policy manually
SELECT * FROM products WHERE true; -- Should return all
```

## Files Updated
- ✅ `pages/ProductsPage.tsx` - Updated fetchProducts logic
- ✅ `services/productService.ts` - Added getAllProducts method
- ✅ `supabase_setup_products_rls_simple.sql` - Simplified RLS policies

## Next Steps
1. Run SQL migration di Supabase
2. Refresh browser
3. Test create/view/edit/delete products
4. Check logs untuk confirm no RLS errors
