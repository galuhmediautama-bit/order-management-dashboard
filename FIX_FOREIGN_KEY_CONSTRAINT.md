# Fix: Foreign Key Constraint Violation

## Problem
Error when saving a product:
```
insert or update on table "products" violates foreign key constraint "products_brand_id_fkey"
```

## Root Cause
The `products` table has a foreign key constraint that requires `brand_id` to exist in the `users` table. However, the application had these issues:

1. **Wrong Data Source**: ProductFormPage was trying to fetch brands from a non-existent `brands` table instead of the `users` table
2. **No Validation**: The productService wasn't validating that the selected brand actually exists before attempting to insert the product
3. **Missing Type Definitions**: The Product type definition was missing the variant and commission fields

## Solution

### 1. Fixed Brand Fetching (ProductFormPage.tsx)
Changed from querying a non-existent `brands` table to querying the `users` table with appropriate filters:

```typescript
const fetchBrands = async () => {
    // Fetch users who can be brands (Super Admin or Admin role)
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .in('role', ['Super Admin', 'Admin'])
        .eq('status', 'Aktif')
        .order('name', { ascending: true });
    
    setBrands(data || []);
};
```

**Why this works:**
- The `brand_id` foreign key points to `users.id`
- Only active Super Admins and Admins can be brands
- This ensures all selected brands are valid and active

### 2. Added Brand Validation (productService.ts)
Added validation in `createProduct()` to check brand exists before insert:

```typescript
// Validate brand exists
if (!product.brandId) {
    throw new Error('Brand ID is required');
}

const { data: brandExists, error: brandError } = await supabase
    .from('users')
    .select('id')
    .eq('id', product.brandId)
    .eq('status', 'Aktif')
    .single();

if (brandError || !brandExists) {
    throw new Error('Brand yang dipilih tidak valid atau tidak aktif. Pilih brand lain.');
}
```

**Why this matters:**
- Pre-validates the brand before attempting insert
- Catches invalid brand_ids early with a clear error message
- Prevents database constraint violations

### 3. Updated Product Type Definition (types.ts)
Added missing fields to the `Product` interface:

```typescript
// Pricing fields
comparePrice?: number;

// Commissions
csCommission?: number;
advCommission?: number;

// Weight & Stock
weight?: number;
stock?: number;

// Variants
variants?: Array<{ ... }>;
variantOptions?: Array<{ ... }>;
```

**Why this was needed:**
- TypeScript was throwing compile errors for properties that didn't exist on the Product type
- These fields are used throughout the product form and service layer

### 4. Improved Error Handling (ProductFormPage.tsx)
Enhanced error messages for foreign key violations:

```typescript
} else if (errorMsg.includes('tidak valid')) {
    errorMsg = 'Brand yang dipilih tidak valid atau tidak aktif. Silakan refresh dan pilih brand lain.';
} else if (errorMsg.includes('ForeignKeyViolation') || errorMsg.includes('fkey')) {
    errorMsg = 'Brand yang dipilih tidak valid. Silakan refresh dan pilih brand lain.';
}
```

## How to Test

1. Open http://localhost:3001/#/produk/tambah
2. Fill in the form:
   - **Nama Produk**: Test Product
   - **Brand**: Select from the dropdown (lists active admins)
   - **Kategori**: Choose any category
   - **Harga Jual**: Enter a price
3. Click save

### Expected Results:
✅ Product saves successfully
✅ No foreign key constraint errors
✅ Product appears in products list

### If errors still occur:
- Make sure the selected brand is an active user with role "Super Admin" or "Admin"
- Check Supabase SQL editor to verify:
  ```sql
  SELECT id, name, role, status FROM users WHERE role IN ('Super Admin', 'Admin') AND status = 'Aktif';
  ```
- Ensure the products table was created with the foreign key constraint

## Files Changed
- `pages/ProductFormPage.tsx` - Fixed brand fetching and error handling
- `services/productService.ts` - Added brand validation
- `types.ts` - Updated Product interface with variant/commission fields

## Database Requirements
The following must exist in Supabase:
- ✅ `users` table with `id`, `name`, `role`, `status` columns
- ✅ `products` table with `brand_id` foreign key to `users.id`

## Key Takeaways
1. **Foreign keys require the referenced data to exist** - Always validate before insert
2. **Query the correct table** - The `brand_id` points to `users`, not a `brands` table
3. **Use parameterized queries** - Supabase JS client handles this automatically
4. **Validate early, fail gracefully** - Check constraints before database operations
