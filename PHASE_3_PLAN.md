# ✅ PHASE 3: Form-Product Integration PLAN

## Objective
Link each form to a parent product from the `products` table.

## Implementation Steps

### Step 1: Add productId field to Form state in FormEditorPage
- In useEffect after fetching form, ensure `form.productId` is loaded
- When creating new form, initialize with `productId: null`

### Step 2: Add Product Selection UI
- Add dropdown to select product (similar to brand selection)
- Show "Link to Product" section in form editor
- Allow form to be unlinked from product (productId = null)

### Step 3: Save productId to Database
- When form.save(), include `productId` in the update
- Query: `UPDATE forms SET product_id = ? WHERE id = ?`

### Step 4: Create Analytics Record
- After form save, call `productService.createOrGetAnalytics()` with:
  - `productId`: form.productId
  - `formId`: form.id
  - `advertiserId`: currentUser.id
- This creates entry in `product_form_analytics` table

### Step 5: Verify Data Flow
Test: Create Form → Link to Product → Check ProductAnalyticsPage shows it

---

## Code Changes Summary

**Files to Update:**
1. `pages/FormEditorPage.tsx`
   - Add `products` state
   - Add `fetchProducts()` function
   - Add product selection UI (dropdown)
   - Add productId to form.save() logic
   - Add analytics creation on save

2. `types.ts` (maybe)
   - Ensure Form interface has `productId?: string` field

---

## Testing Checklist
- [ ] Open FormEditorPage
- [ ] See "Link to Product" section with dropdown
- [ ] Create/Edit form and select a product
- [ ] Save form
- [ ] Check ProductAnalyticsPage - should show the form in product's analytics

---

## Ready to code?

**Status:** Ready to implement in FormEditorPage

Say "ok lanjut" when ready!
