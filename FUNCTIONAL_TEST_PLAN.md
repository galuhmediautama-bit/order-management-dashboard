# 🧪 FUNCTIONAL TESTING PLAN & CHECKLIST

**Application**: Order Management Dashboard  
**Date**: December 7, 2025  
**Scope**: Complete functional validation of all major features

---

## 📋 Test Categories

### 1. CRUD Operations Testing
### 2. UI Buttons & Links Testing
### 3. Form Validation Testing
### 4. File Upload/Download Testing
### 5. Pagination & Filtering Testing
### 6. Error Handling Testing
### 7. Authentication & Authorization Testing
### 8. API Integration Testing

---

## TEST PLAN DETAILS

### 1. CRUD OPERATIONS TESTING

#### Orders (OrdersPage)
- [ ] **CREATE**: Create new order via form → verify data saved in DB
- [ ] **READ**: Load orders list → verify data displays correctly
- [ ] **UPDATE**: Edit order status (Pending → Processing → Shipped → Delivered) → verify changes saved
- [ ] **DELETE**: Delete order → verify confirmation modal → verify deleted from list
- [ ] **Filter**: By status, date range, customer name → results should be accurate
- [ ] **Pagination**: Move between pages (10, 25, 50 items per page) → data should load correctly

**Test Cases**:
```
✓ Create order without customer name → should show validation error
✓ Create order with valid data → should save to DB
✓ Edit order status to Shipped → should update DB
✓ Delete order → should ask for confirmation → should remove from list
✓ Filter orders by "Shipped" status → should show only shipped orders
✓ Pagination: Go to page 2 → data should be different from page 1
```

#### Forms (FormsPage)
- [ ] **CREATE**: Create new form via FormEditorPage → verify saved
- [ ] **READ**: Load forms list → verify all forms display
- [ ] **UPDATE**: Edit form title, description, variants → verify saved
- [ ] **DELETE**: Delete form → verify confirmation → verify removed from list
- [ ] **TOGGLE**: Toggle form active/inactive → verify status changes in DB

**Test Cases**:
```
✓ Create form with title, description, product variant
✓ Edit form title → changes visible in list
✓ Add new product variant to form → should appear in editor
✓ Delete variant from form → should be removed
✓ Delete entire form → confirmation modal appears → form removed from list
```

#### Products (ProductsPage)
- [ ] **CREATE**: Add new product with name, price, brand, description
- [ ] **READ**: Display product list with filters
- [ ] **UPDATE**: Edit product details, stock, price
- [ ] **DELETE**: Delete product with confirmation

**Test Cases**:
```
✓ Create product with required fields → should appear in list
✓ Edit product price → reflected in product list and forms
✓ Delete product → confirmation appears → removed from system
✓ Filter products by brand → correct products shown
```

#### Customers (CustomersPage)
- [ ] **READ**: Display customers with COD scoring
- [ ] **UPDATE**: Edit customer contact info
- [ ] **VIEW**: Customer order history

**Test Cases**:
```
✓ View customer list with scores (A, B, C, etc.)
✓ Click customer → shows order history
✓ Edit customer phone/email → changes saved
```

#### Users (SettingsPage - Users Tab)
- [ ] **CREATE**: Create new user with email, name, role
- [ ] **READ**: Display all users with filters
- [ ] **UPDATE**: Edit user role, assigned brands
- [ ] **DELETE**: Delete user from system

**Test Cases**:
```
✓ Create user with valid email → user appears in list
✓ Create user with duplicate email → validation error
✓ Change user role from Advertiser to CS → role updates in DB
✓ Approve pending user → status changes from "Tidak Aktif" to "Aktif"
✓ Delete user → confirmation modal → user removed
```

---

### 2. UI BUTTONS & LINKS TESTING

#### Navigation (Sidebar & Header)
- [ ] **Dashboard**: Click Dashboard link → navigates to /dashboard
- [ ] **Orders**: Click Orders → navigates to /orders
- [ ] **Forms**: Click Forms → navigates to /forms
- [ ] **Products**: Click Products → navigates to /products
- [ ] **Customers**: Click Customers → navigates to /customers
- [ ] **Settings**: Click Settings → navigates to /settings
- [ ] **Notifications**: Click bell icon → shows notification list
- [ ] **Profile**: Click profile avatar → shows profile menu, logout option

**Test Cases**:
```
✓ Sidebar links navigate to correct pages
✓ Sidebar collapses/expands on mobile
✓ Current page highlighted in sidebar
✓ Logout button removes session and redirects to login
✓ Header shows username and role
```

#### Action Buttons
- [ ] **+ New** buttons create new items (Orders, Forms, Products)
- [ ] **Edit** buttons open edit modals/pages
- [ ] **Delete** buttons show confirmation modals
- [ ] **Export** buttons generate CSV files
- [ ] **Filter** buttons open filter panels
- [ ] **Search** input filters results in real-time

**Test Cases**:
```
✓ Click "+ New Order" → form page opens
✓ Click Edit button on order → modal with form data appears
✓ Click Delete button → confirmation modal with "Are you sure?" appears
✓ Click Export CSV → file downloads to device
✓ Click Filter button → filter panel expands
✓ Type in search → results filter automatically
```

#### Modal Buttons
- [ ] **Confirm** button saves changes
- [ ] **Cancel** button closes modal without saving
- [ ] **X** (close) button closes modal
- [ ] **Back** button goes to previous page

**Test Cases**:
```
✓ Click Confirm in edit modal → changes saved, modal closes
✓ Click Cancel → modal closes, no changes saved
✓ Click X → modal closes
✓ Click Back on form editor → returns to forms list
```

---

### 3. FORM VALIDATION TESTING

#### Required Fields
- [ ] **Email field**: 
  - Empty → error: "Email is required"
  - Invalid format (no @) → error: "Invalid email format"
  - Valid email → accepts

- [ ] **Password field**:
  - Empty → error: "Password is required"
  - Less than 8 chars → error: "Password must be at least 8 characters"
  - Valid password → accepts

- [ ] **Name field**:
  - Empty → error: "Name is required"
  - Valid name → accepts

- [ ] **Order Amount**:
  - Empty → error: "Amount is required"
  - Non-numeric → error: "Must be a number"
  - Valid amount → accepts

**Test Cases**:
```
✓ Submit order form with empty customer name → validation error
✓ Submit user form with invalid email → validation error
✓ Submit form with required field empty → error message shows
✓ Fill all required fields → form submits successfully
```

#### Format Validation
- [ ] **Email**: test@example.com (valid), test@.com (invalid), test@example (invalid)
- [ ] **Phone**: 08123456789, +62812345678 (valid), 123 (invalid)
- [ ] **Amount**: 100000, 50000.50 (valid), abc, -100 (invalid)
- [ ] **URL**: https://example.com (valid), example (invalid)

**Test Cases**:
```
✓ Enter invalid email format → error appears below field
✓ Enter valid email → error disappears
✓ Enter phone with letters → error appears
✓ Enter negative amount → error appears
✓ Enter valid amount → accepted
```

#### Conditional Validation
- [ ] **COD selected**: Requires valid address
- [ ] **Bank Transfer selected**: Requires bank account info
- [ ] **Custom variant**: Requires product selection
- [ ] **Role change**: Requires permission selection

**Test Cases**:
```
✓ Select COD payment → address field becomes required
✓ Select Bank Transfer → bank info fields required
✓ Create CS Agent user → must assign to brands
```

---

### 4. FILE UPLOAD/DOWNLOAD TESTING

#### Image Upload (Forms/Products)
- [ ] **Upload valid image** (jpg, png, jpeg) → displays in preview
- [ ] **Upload invalid format** (pdf, txt) → error: "Only images allowed"
- [ ] **Upload large file** (>5MB) → error: "File too large"
- [ ] **Upload successful** → image URL saved in DB

**Test Cases**:
```
✓ Upload form hero image → preview appears
✓ Upload product image → image displays in product card
✓ Try uploading PDF → error: "Invalid file format"
✓ Upload 10MB image → error: "File must be < 5MB"
✓ Upload valid image → URL saved to Supabase
```

#### CSV Export
- [ ] **Export Orders**: Download CSV with order data
- [ ] **Export Customers**: Download CSV with customer list
- [ ] **Export forms**: List all forms in downloadable format
- [ ] **File format**: Should be valid CSV (can open in Excel)
- [ ] **Data accuracy**: Data in CSV matches displayed data

**Test Cases**:
```
✓ Click Export Orders → file downloads
✓ Open CSV file → data matches table
✓ Filter orders → export only filtered results
✓ Export customers → includes COD score
```

---

### 5. PAGINATION & FILTERING TESTING

#### Pagination
- [ ] **Page size selector**: Change from 10 → 25 → 50 items per page
- [ ] **Next button**: Go to page 2, 3, etc.
- [ ] **Previous button**: Go back to previous page
- [ ] **Page info**: Display "Showing 1-10 of 150" correctly
- [ ] **Last page**: Previous button disabled on page 1, Next disabled on last page

**Test Cases**:
```
✓ Orders list default = 10 items per page
✓ Change to 25 items per page → list shows 25 items
✓ Click Next → page 2 appears with different data
✓ Click Previous → page 1 appears
✓ Last page shows fewer items than page size
```

#### Filtering
- [ ] **Status filter**: Show only orders with status = "Shipped"
- [ ] **Date range filter**: Show orders between start-end date
- [ ] **Role filter**: Show only users with role = "Advertiser"
- [ ] **Brand filter**: Show only products from specific brand
- [ ] **Multi-filter**: Combine multiple filters (status + date + brand)
- [ ] **Clear filters**: Reset all filters to show all data

**Test Cases**:
```
✓ Filter orders by "Shipped" status → only shipped orders visible
✓ Filter by date range → only orders in range visible
✓ Filter products by brand → only brand products shown
✓ Apply multiple filters → results match all criteria
✓ Click Clear Filters → all data visible again
```

#### Sorting
- [ ] **Sort by column**: Click column header to sort ascending/descending
- [ ] **Sort orders by date**: Newest/oldest first
- [ ] **Sort customers by score**: A-Z or Z-A
- [ ] **Sort users by role**: Alphabetical

**Test Cases**:
```
✓ Click "Date" column → sorts by date ascending
✓ Click "Date" again → sorts descending
✓ Sort customers by name → A-Z order
✓ Sort orders by amount → low to high
```

---

### 6. ERROR HANDLING TESTING

#### Toast Error Messages
- [ ] **Validation error**: "Please fill all required fields"
- [ ] **Duplicate email**: "Email already in use"
- [ ] **Network error**: "Connection failed, please try again"
- [ ] **Permission error**: "You don't have permission to perform this action"
- [ ] **Not found**: "Order not found"

**Test Cases**:
```
✓ Submit form without required field → toast error appears (red)
✓ Try to update someone else's profile → permission error
✓ Network disconnected → connection error toast
✓ Create duplicate user email → duplicate email error
```

#### Error Message Timing
- [ ] Toast appears for 3 seconds then disappears
- [ ] User can dismiss by clicking X
- [ ] Multiple errors show as separate toasts
- [ ] Success messages show green toast
- [ ] Error messages show red toast

**Test Cases**:
```
✓ Error toast appears below header
✓ Error auto-dismisses after 3 seconds
✓ Can manually close by clicking X
✓ Success message is green
✓ Error message is red
```

#### Database Errors
- [ ] RLS policy violation: "Unauthorized to access this data"
- [ ] Record not found: "Record does not exist"
- [ ] Duplicate key: "This record already exists"
- [ ] Connection timeout: "Request timed out, please try again"

**Test Cases**:
```
✓ Try to access another user's orders → RLS error
✓ Delete user → user removed → cannot access their data
✓ Create user with duplicate email → duplicate error
```

---

### 7. AUTHENTICATION & AUTHORIZATION TESTING

#### Login Flow
- [ ] **Valid credentials**: Login successful, redirected to dashboard
- [ ] **Invalid email**: "User not found" or "Invalid credentials"
- [ ] **Wrong password**: "Invalid password"
- [ ] **Inactive user**: "Your account is not active. Contact admin"
- [ ] **Remember session**: Refresh page → still logged in

**Test Cases**:
```
✓ Login with valid Super Admin credentials → dashboard appears
✓ Login with invalid email → error message
✓ Login with wrong password → error message
✓ Login with inactive user (status = 'Tidak Aktif') → blocked
✓ Refresh page after login → session persists
```

#### Logout Flow
- [ ] **Click logout**: Session cleared, redirected to login page
- [ ] **Refresh after logout**: Cannot access protected pages
- [ ] **Local storage cleared**: No auth token in storage

**Test Cases**:
```
✓ Click logout button → redirected to login
✓ Try accessing /dashboard after logout → redirected to login
✓ Check localStorage → auth token removed
```

#### Role-Based Access Control
- [ ] **Super Admin**: Can access all pages and features
- [ ] **Advertiser**: Can only see own forms, orders, earnings
- [ ] **CS Agent**: Can only access orders and customers assigned to them
- [ ] **Keuangan**: Can only access financial reports and settings
- [ ] **Unauthorized access**: Try to access restricted page → redirected or error

**Test Cases**:
```
✓ Login as Super Admin → all sidebar menus visible
✓ Login as Advertiser → only Advertiser menus visible
✓ Login as CS Agent → only CS pages visible
✓ Try accessing /settings as Advertiser → redirected or forbidden
✓ Advertiser can only see own forms (not other's forms)
```

#### Permission Checks
- [ ] **Create order**: All roles can create (if form assigned)
- [ ] **Edit user**: Only Super Admin can edit users
- [ ] **Delete form**: Only form owner or Super Admin
- [ ] **Export data**: Only authorized roles
- [ ] **Change role**: Only Super Admin

**Test Cases**:
```
✓ Advertiser tries to delete another's form → permission error
✓ CS tries to edit user info → permission error
✓ Super Admin can edit any user → allowed
✓ Export button only shows for roles with permission
```

---

### 8. API INTEGRATION TESTING

#### Supabase CRUD Operations
- [ ] **Insert**: Create new record → appears in DB
- [ ] **Select**: Query returns correct data
- [ ] **Update**: Edit record → DB updated
- [ ] **Delete**: Remove record → DB updated

**Test Cases**:
```
✓ Create order → appears in orders table
✓ Select orders → correct data returned
✓ Update order status → status changes in DB
✓ Delete order → removed from orders table
```

#### RLS Policies
- [ ] **User can read own records**: Select own data → works
- [ ] **User cannot read others' records**: Select other's data → denied
- [ ] **Super Admin can read all**: Select any data → works
- [ ] **Update/Delete authorized only**: Own records can be updated/deleted

**Test Cases**:
```
✓ Advertiser queries own forms → returns data
✓ Advertiser queries another's forms → RLS blocks
✓ Super Admin queries any data → works
✓ Advertiser tries to update another's form → RLS error
```

#### Real-time Subscriptions
- [ ] **Subscribe to orders**: New orders appear in real-time
- [ ] **Subscribe to notifications**: New notifications appear instantly
- [ ] **Unsubscribe**: Stop receiving updates

**Test Cases**:
```
✓ Open orders page → real-time updates when new order created
✓ Open notifications → new notifications appear instantly
✓ Close page → unsubscribe, no more updates
```

#### Error Handling
- [ ] **Network down**: Error toast, retry option
- [ ] **Invalid data**: Validation error from API
- [ ] **Timeout**: Request timeout error
- [ ] **401 Unauthorized**: Redirect to login

**Test Cases**:
```
✓ Disconnect network → error appears
✓ Reconnect → data reloads
✓ Send invalid data → API validation error
✓ Session expires → redirected to login
```

---

## EXECUTION SUMMARY

**Total Test Cases**: ~100+  
**Categories**: 8  
**Estimated Time**: 3-4 hours  

**Priority**:
- 🔴 **Critical**: CRUD, Auth, API (must pass)
- 🟡 **High**: Validation, Error Handling (must pass)
- 🟢 **Medium**: Pagination, Filters, UI (should pass)
- 🔵 **Low**: File upload, edge cases (nice to have)

---

## TEST EXECUTION LOG

**To be filled during testing:**

```
Date: [Date]
Tester: [Name]
Browser: [Chrome/Firefox/Safari]
Device: [Desktop/Mobile]

Test Case | Status | Notes
-----------|--------|------
[Test case name] | ✓ PASS / ✗ FAIL | [Any observations]
```

---

## REPORT TEMPLATE

**Critical Issues Found**: [Count]  
**High Priority Issues**: [Count]  
**Medium Priority Issues**: [Count]  
**Total Pass Rate**: [%]  

**Blockers**: (Issues that prevent deployment)  
**Recommendations**: (Improvements needed)  
**Sign-off**: Ready for production? YES / NO / CONDITIONAL

---

**Next Steps**: Execute tests systematically and document findings.
