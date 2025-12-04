# Debug Guide: Empty Products in Form Editor Dropdown

## Problem
"Induk Produk tidak ada di formulir" - Master Product dropdown shows no products in Form Editor, even after:
- Selecting a brand
- Products appearing in ProductsPage
- Code fix applied to fetch all products

## Root Cause Analysis

The issue is likely one of these:
1. **No products created yet** - ProductsPage shows 0 products
2. **Products with wrong status** - Created with status ≠ 'active' (e.g., 'draft', 'inactive')
3. **Database migration not applied** - Products table not created in Supabase
4. **RLS blocking access** - Though unlikely with current policy

## Step-by-Step Debug Guide

### Step 1: Check if Products Table Exists
1. Go to Supabase Dashboard → SQL Editor
2. Run:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
LIMIT 5;
```
3. If result is empty → Products table NOT created (need to run migrations)
4. If result shows columns → Table exists, proceed to Step 2

### Step 2: Check Product Count and Status
1. In Supabase SQL Editor, run:
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
  status,
  COUNT(*) as count_by_status
FROM products
GROUP BY status
ORDER BY count_by_status DESC;
```
2. **Result shows 0 total_products** → No products created yet
   - Go to ProductsPage → Click "Tambah Produk" → Create a test product
   - Wait for toast "Produk berhasil ditambahkan"
   - Re-run query to verify product inserted with status='active'

3. **Result shows products but 0 active_products** → All products have wrong status
   - Fix: Run update query:
   ```sql
   UPDATE products SET status = 'active' WHERE status != 'active';
   ```

4. **Result shows X active products** → Data exists, problem is in code/query
   - Go to Step 3

### Step 3: Check Browser Console Logs
1. Open Form Editor page
2. Press F12 → Go to Console tab
3. Select a brand from dropdown
4. Look for logs:
   - "All products fetched: X" → If X > 0, products are loading but not displaying
   - "getAllProducts failed, trying getProductsByBrand" → Fallback was triggered
   - Error messages → Copy and debug

**If no logs appear:**
- Clear cache: Ctrl+Shift+Delete → Check "Cached images and files" → Clear
- Refresh page: Ctrl+F5
- Look for network errors in Network tab

### Step 4: Test Direct Query in Supabase
1. In Supabase SQL Editor, run:
```sql
SELECT id, name, brand_id, status, category, base_price
FROM products
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;
```
2. **No results** → No active products exist
   - Create products in ProductsPage
3. **Results show products** → Data exists but fetch is failing
   - Go to Step 5

### Step 5: Check RLS Policy
1. In Supabase SQL Editor, run:
```sql
SELECT * FROM pg_policies WHERE tablename = 'products';
```
2. Look for policy with `FOR SELECT`
3. Should show `USING (true)` or `USING (auth.role() = 'authenticated')`

**If policy is missing or restricts:**
- Run migrations: `supabase_setup_products_rls_simple.sql`

### Step 6: Verify User Authentication
1. Open Form Editor
2. Press F12 → Console
3. Run: `console.log(localStorage.getItem('supabase.auth.token'))`
4. If null → User not authenticated → Must login first
5. If token exists → Authenticated, problem is query/data

## Quick Fixes by Symptom

### Symptom: Dropdown empty, no logs in console
**Solution:**
1. Refresh browser: Ctrl+F5
2. Clear cache: Ctrl+Shift+Delete
3. Check if form brand is selected (dropdown won't filter without brand)
4. Run: `npm run dev` in terminal to restart dev server

### Symptom: "All products fetched: 0" in console
**Solution:**
1. Go to Supabase → SQL Editor
2. Run: `SELECT COUNT(*) as total FROM products WHERE status = 'active'`
3. If 0 → Create products in ProductsPage
4. If > 0 → RLS or permission issue (run RLS migration)

### Symptom: "getAllProducts failed, trying getProductsByBrand"
**Solution:**
1. Check Supabase logs: Dashboard → Logs → Recent errors
2. Run RLS migration: `supabase_setup_products_rls_simple.sql`
3. Verify user role: User must be 'Super Admin' or have assigned brands
4. Check network: Dashboard → Logs → Recent queries to products table

### Symptom: Products appear in ProductsPage but not in Form Editor
**Solution:**
1. This is a brand filtering issue
2. Check selected form brand: `console.log(currentForm.brandId)`
3. Check products' brand_id: In Supabase, run:
```sql
SELECT DISTINCT brand_id, COUNT(*) as count FROM products GROUP BY brand_id;
```
4. Verify product.brandId matches form.brandId

## Testing Checklist

After fixing, verify:
- [ ] Products table exists: `SELECT * FROM products LIMIT 1`
- [ ] Active products exist: `SELECT COUNT(*) FROM products WHERE status='active'`
- [ ] RLS allows SELECT: `SELECT * FROM pg_policies WHERE tablename='products'`
- [ ] Can create product: ProductsPage → Tambah Produk → Create test product
- [ ] Can see in FormEditor: Form → Select brand → Induk Produk dropdown shows products
- [ ] Browser console shows: "All products fetched: X" (X > 0)
- [ ] Selected product auto-loads variants: Choose product → variants appear

## Code Locations for Reference

**FormEditorPage.tsx (lines ~935-960):**
- Product fetching logic
- Brand filtering
- Console logging

**ProductFormPage.tsx (lines ~327):**
- handleSave function for creating products
- Validation logic

**productService.ts (lines ~45-115):**
- getAllProducts() method
- getProductsByBrand() method
- Query logic

**Database Schema:**
- products table: brand_id, name, sku, status, category, base_price, attributes (JSONB)
- Must have status = 'active' to show in FormEditor

## Files to Check/Run if Problem Persists

1. **Migrations:**
   - `supabase_products_table.sql` - Creates products table
   - `supabase_setup_products_rls_simple.sql` - Sets RLS policies
   - Run in Supabase SQL Editor

2. **Service Methods:**
   - `services/productService.ts` - getAllProducts(), getProductsByBrand(), transformProduct()

3. **Components:**
   - `pages/FormEditorPage.tsx` - Induk Produk dropdown logic
   - `pages/ProductFormPage.tsx` - Product creation form
   - `pages/ProductsPage.tsx` - Products list and creation UI

## Contact Debug Data to Share

When reporting issue, include:
1. Screenshot of browser console when opening Form Editor
2. Screenshot of ProductsPage (shows "Belum ada produk" or product count?)
3. Result of Supabase query: `SELECT COUNT(*) FROM products WHERE status='active'`
4. Current user role (Super Admin / Admin / other)
5. Brand selected in form (if any)
