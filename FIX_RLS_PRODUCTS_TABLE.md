# Fix RLS (Row Level Security) untuk Products Table

## Masalah
```
new row violates row-level security policy for table "products"
```

Error ini terjadi ketika RLS policy belum dikonfigurasi atau policy yang ada tidak memungkinkan INSERT untuk user yang sedang login.

## Solusi

### Step 1: Jalankan SQL Migration di Supabase

1. Buka [Supabase Dashboard](https://supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy-paste isi file `supabase_setup_products_rls.sql`
5. Klik **Run** (Ctrl+Enter)

**ATAU** Gunakan Supabase CLI:
```bash
supabase db push
```

### Step 2: Verifikasi RLS Policies

Jalankan query ini di SQL Editor untuk memverifikasi policies sudah dibuat:

```sql
SELECT 
    tablename, 
    policyname, 
    permissive, 
    qual as policy_condition
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;
```

Expected output:
```
admin_delete_own_products      | PERMISSIVE | ...
admin_insert_own_products      | PERMISSIVE | ...
admin_update_own_products      | PERMISSIVE | ...
admin_view_own_products        | PERMISSIVE | ...
authenticated_view_products    | PERMISSIVE | ...
advertiser_view_products       | PERMISSIVE | ...
super_admin_delete_products    | PERMISSIVE | ...
super_admin_insert_products    | PERMISSIVE | ...
super_admin_update_products    | PERMISSIVE | ...
super_admin_view_products      | PERMISSIVE | ...
```

### Step 3: Bersihkan Policies Lama (Jika Ada)

Jika ada policy lama yang conflict, hapus terlebih dahulu:

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

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

Kemudian jalankan `supabase_setup_products_rls.sql` lagi.

## Policy Explanation

### Super Admin
- ✅ View all products
- ✅ Create/Edit/Delete any product

### Admin (Brand Owner)
- ✅ View own products (where `brand_id = user_id`)
- ✅ Create products for own brand
- ✅ Edit own products
- ✅ Delete own products

### Authenticated Users (Advertisers, CS, etc)
- ✅ View products for using in forms
- ❌ Cannot create/edit/delete products

## Testing

### Test 1: Create Product sebagai Super Admin
```typescript
// Harus berhasil
const { data, error } = await supabase
    .from('products')
    .insert([{ brand_id: 'some-brand-id', name: 'Test Product', ... }]);
```

### Test 2: Create Product sebagai Admin dengan brand_id = user_id
```typescript
// Harus berhasil jika brand_id === auth.uid()
const { data, error } = await supabase
    .from('products')
    .insert([{ brand_id: auth.uid(), name: 'Test Product', ... }]);
```

### Test 3: Create Product sebagai Admin dengan brand_id ≠ user_id
```typescript
// Harus gagal dengan RLS error
const { data, error } = await supabase
    .from('products')
    .insert([{ brand_id: 'other-brand-id', name: 'Test Product', ... }]);
```

## Troubleshooting

### Problem 1: "User not found in users table"
**Solusi**: Pastikan user sudah login dan ada di tabel `users` dengan `status = 'Aktif'`

### Problem 2: "Role column missing"
**Solusi**: Pastikan tabel `users` memiliki kolom `role` dengan value: 'Super Admin' | 'Admin' | ...

### Problem 3: RLS policies still not working
**Solusi**: 
1. Cek apakah RLS sudah enabled pada products table:
   ```sql
   SELECT relrowsecurity FROM pg_class WHERE relname = 'products';
   ```
   Harus return `TRUE`

2. Jika return FALSE, enable RLS:
   ```sql
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
   ```

3. Pastikan tidak ada policy dengan `RESTRICTIVE` type yang conflict

## Alternative: Disable RLS Temporarily (NOT RECOMMENDED)

Jika Anda ingin development lebih cepat tanpa RLS (tidak aman untuk production):

```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING**: Jangan gunakan di production! Selalu gunakan RLS untuk security.

## Next Steps

1. ✅ Jalankan `supabase_setup_products_rls.sql`
2. ✅ Verifikasi dengan query di atas
3. ✅ Test creating/editing products di application
4. ✅ Check logs untuk memastikan tidak ada RLS errors
5. ✅ Deploy ke production dengan RLS enabled
