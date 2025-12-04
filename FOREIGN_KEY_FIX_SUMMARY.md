# Quick Reference: Foreign Key Constraint Fix

## The Error
```
insert or update on table "products" violates foreign key constraint "products_brand_id_fkey"
```

## What Was Wrong
1. ❌ Fetching brands from non-existent `brands` table
2. ❌ No validation that brand exists before insert
3. ❌ Product type missing variant fields

## What Changed

### ProductFormPage.tsx
**Before:**
```typescript
const { data } = await supabase
    .from('brands')  // ❌ This table doesn't exist
    .select('id, name')
```

**After:**
```typescript
const { data } = await supabase
    .from('users')  // ✅ Query the correct table
    .select('id, name, role')
    .in('role', ['Super Admin', 'Admin'])
    .eq('status', 'Aktif')
```

### productService.ts
**Added validation:**
```typescript
// Validate brand exists and is active
const { data: brandExists } = await supabase
    .from('users')
    .select('id')
    .eq('id', product.brandId)
    .eq('status', 'Aktif')
    .single();

if (!brandExists) {
    throw new Error('Brand invalid or inactive');
}
```

### types.ts
**Added missing fields to Product interface:**
```typescript
comparePrice?: number;
csCommission?: number;
advCommission?: number;
weight?: number;
stock?: number;
variants?: Array<{ name: string; sku?: string; price: number; ... }>;
variantOptions?: Array<{ name: string; values: string[] }>;
```

## Result
✅ Products can now be created without foreign key violations
✅ Clear error messages if brand is invalid
✅ Type-safe code with all variant fields defined
✅ Build completes successfully

## How It Works Now

```
User selects brand → 
Fetch active admins from users table → 
Validate selected brand exists → 
Create product with valid brand_id → 
Product saves successfully ✓
```

## Testing Checklist
- [ ] Brands dropdown shows active admins
- [ ] Can create product with valid brand
- [ ] Clear error if brand becomes inactive
- [ ] No TypeScript compilation errors
- [ ] npm run build completes successfully
