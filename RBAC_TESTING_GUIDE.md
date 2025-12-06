# RBAC System - Testing Guide

## Manual Testing Checklist

### Prerequisites
- [ ] Logged in as Super Admin
- [ ] Browser DevTools open (F12)
- [ ] Console tab active for logging
- [ ] Have access to at least 2 different user roles to test

---

## Test Suite 1: Permission Configuration UI

### Test 1.1: Access Permission Manager
**Steps:**
1. Navigate to **Pengaturan** → **Manajemen Peran**
2. Verify role cards display with user counts
3. Click **"Kelola Menu & Fitur"** button on "Advertiser" role card
4. **Expected Result:** RolePermissionManager modal opens

**Logging:**
```
✅ Modal title shows: "Kelola Izin Peran: Advertiser"
✅ Menu checklist displays all 22 menus
✅ Feature checklist displays all 11 features
```

### Test 1.2: Select Individual Menu
**Steps:**
1. In modal, find "Produk" menu
2. Click checkbox next to "Produk"
3. **Expected Result:** Checkbox becomes checked

**Verification:**
- [ ] Checkbox state updates immediately
- [ ] Summary updates count (Menu: +1)

### Test 1.3: Select All Menus
**Steps:**
1. Click "Pilih Semua Menu" button
2. **Expected Result:** All menu checkboxes become checked

**Verification:**
- [ ] All 22 menus are checked
- [ ] Summary shows "Menu yang dipilih: 22"

### Test 1.4: Deselect All Menus
**Steps:**
1. Click "Pilih Semua Menu" again (toggle off)
2. **Expected Result:** All menu checkboxes become unchecked

**Verification:**
- [ ] All 22 menus are unchecked
- [ ] Summary shows "Menu yang dipilih: 0"

### Test 1.5: Feature Selection Works Same Way
**Steps:**
1. Repeat Test 1.2-1.4 for Features section
2. **Expected Result:** Same behavior as menus

**Verification:**
- [ ] Individual feature selection works
- [ ] "Pilih Semua Fitur" toggle works correctly
- [ ] Summary updates accurately

### Test 1.6: Save Permissions
**Steps:**
1. Select subset: 5 menus, 3 features
2. Click "Simpan Izin" button
3. **Expected Result:** 
   - Button shows loading spinner
   - Toast message: "Izin untuk peran 'Advertiser' berhasil disimpan"
   - Modal closes

**Verification:**
```javascript
// In browser console, check database
const { data } = await supabase
  .from('settings')
  .select('rolePermissions')
  .eq('id', 'rolePermissions')
  .single();
console.log(data.rolePermissions['Advertiser']);
// Should show: { menus: [...5 IDs], features: [...3 IDs] }
```

### Test 1.7: Cancel Permission Manager
**Steps:**
1. Open modal for any role
2. Make selections (but don't save)
3. Click "Batal" or X button
4. **Expected Result:** Modal closes without saving

**Verification:**
- [ ] Modal closes
- [ ] Changes are discarded

---

## Test Suite 2: Dynamic Menu Visibility

### Test 2.1: Advertiser Sees Only Permitted Menus
**Steps:**
1. Logout and login as Advertiser user (e.g., "partner@example.com")
2. View sidebar
3. Open browser console

**Expected Result:** Sidebar shows only:
- ✅ Dasbor (Dashboard)
- ✅ Produk (Products)
- ✅ Laporan (Reports) 
- ✅ Penghasilan (Earnings)

**Menus should NOT appear:**
- ❌ Pesanan (Orders)
- ❌ Pelanggan (Customers)
- ❌ Pengaturan (Settings)

**Console Check:**
```javascript
// Should see logs like:
// 🔍 Sidebar canSee: Produk { rbacMenuId: 'products', userRole: 'Advertiser', hasAccess: true }
// 🔍 Sidebar canSee: Pesanan { rbacMenuId: 'orders', userRole: 'Advertiser', hasAccess: false }
```

### Test 2.2: Admin Sees All Menus
**Steps:**
1. Logout and login as Admin
2. View sidebar

**Expected Result:** Admin sees all menus except restricted ones

**Verification:**
- [ ] Dashboard visible
- [ ] Produk menu and submenus visible
- [ ] Pesanan menu visible
- [ ] Laporan menu visible
- [ ] Penghasilan visible
- [ ] Pengaturan visible with all submenus

### Test 2.3: Customer Service Role Menus
**Steps:**
1. Logout and login as Customer Service
2. View sidebar

**Expected Result (Based on DEFAULT_ROLE_PERMISSIONS):**
- ✅ Dashboard
- ✅ Pesanan (Orders) - both submenus
- ✅ Pelanggan (Customers)
- ✅ Penghasilan (Earnings)

**Menus should NOT appear:**
- ❌ Produk
- ❌ Laporan
- ❌ Pengaturan

### Test 2.4: Gudang Role Minimal Menus
**Steps:**
1. Logout and login as Gudang (Warehouse) user
2. View sidebar

**Expected Result (Most Restricted):**
- ✅ Dashboard
- ✅ Pesanan (Orders) with order list only

**All other menus NOT visible:**
- ❌ Produk, Pelanggan, Laporan, Penghasilan, Pengaturan, etc.

---

## Test Suite 3: Real-Time Permission Updates

### Test 3.1: Modify Advertiser Permissions and Observe
**Steps:**
1. Open **2 browser tabs/windows**
   - Tab A: Logged in as Super Admin
   - Tab B: Logged in as Advertiser
2. In Tab A: Pengaturan → Manajemen Peran
3. Click "Kelola Menu & Fitur" for Advertiser
4. Uncheck "Penghasilan" (Earnings) menu
5. Click "Simpan Izin"
6. **Tab B:** Refresh page (Ctrl+R)
7. **Expected Result:** Penghasilan menu disappears from Advertiser's sidebar

**Verification:**
- [ ] Menu was visible before permission change
- [ ] Menu is gone after refresh
- [ ] Other menus still visible

### Test 3.2: Add Permission and Observe Update
**Steps:**
1. In Tab A: Permission manager still open
2. Check "Pesanan" menu (add Orders)
3. Click "Simpan Izin"
4. **Tab B:** Refresh
5. **Expected Result:** Pesanan menu now appears

**Verification:**
- [ ] Pesanan menu appears
- [ ] Submenu items visible
- [ ] Can navigate to Daftar Pesanan and Pesanan Tertinggal

### Test 3.3: Automatic Refresh After 5 Minutes
**Steps:**
1. In Tab A: Change Advertiser permissions
2. Click "Simpan Izin"
3. **Tab B:** Wait 5 minutes without refresh
4. **Expected Result:** After 5 minutes, permissions automatically update

**Verification:**
- [ ] Sidebar updates without page refresh (after 5 min)
- [ ] Console shows `refreshPermissions` call

---

## Test Suite 4: Feature Permission Controls

### Test 4.1: CSV Export Button Feature
**Prerequisites:** Complete Test 4.1.1 first

**Test 4.1.1: Configure Advertiser without Export Feature**
1. As Super Admin, open Advertiser permission manager
2. Uncheck "export_csv" from Features list
3. Save permissions

**Test 4.1.2: Verify Export Button Disappears**
1. Logout and login as Advertiser
2. Navigate to any list page (Orders, Customers, etc.)
3. **Expected Result:** No "Export CSV" button visible

**Verification:**
- [ ] Button completely removed from DOM (not just hidden)
- [ ] Layout flows correctly without button space

**Test 4.1.3: Add Export Feature Back**
1. As Super Admin, enable "export_csv" feature for Advertiser
2. As Advertiser, refresh page
3. **Expected Result:** "Export CSV" button reappears

---

## Test Suite 5: Dashboard Customization

### Test 5.1: Advertiser Dashboard
**Steps:**
1. Login as Advertiser
2. Navigate to Dashboard
3. **Expected Result:**
   - Custom welcome card with "📢 Advertiser" badge
   - Shows: "Welcome back, [Name]!"
   - Displays 3 metrics: Total Pesanan, Total Penjualan, Conversion Rate
   - Super Admin panel NOT visible

**Verification:**
```javascript
// Check element exists
document.querySelector('[data-advertiser-welcome]'); // Should exist
document.querySelector('[data-super-admin-panel]');  // Should NOT exist
```

### Test 5.2: Admin Dashboard
**Steps:**
1. Login as Admin
2. Navigate to Dashboard
3. **Expected Result:**
   - Full dashboard with all widgets
   - Multiple metric cards
   - Advertiser welcome card NOT shown

---

## Test Suite 6: Error Handling

### Test 6.1: Permissions Load Error Recovery
**Steps:**
1. Simulate network error (DevTools Network → Offline)
2. Refresh page
3. **Expected Result:**
   - App falls back to DEFAULT_ROLE_PERMISSIONS
   - No console errors
   - Sidebar still functions with default permissions
4. Go back online
5. **Expected Result:**
   - After 5 min refresh, permissions sync from database

**Verification:**
```javascript
// Check console for error handling
const { error } = useRolePermissions();
console.log(error); // Null if recovered, string if still failing
```

### Test 6.2: Invalid Role Handling
**Steps:**
1. Create custom role in database not in DEFAULT_ROLE_PERMISSIONS
2. Assign user to that role
3. Login with that user
4. **Expected Result:**
   - User sees default dashboard (limited access)
   - No crash
   - Console logs role not found

---

## Test Suite 7: Edge Cases

### Test 7.1: Super Admin Bypass
**Steps:**
1. Restrict all menus for Super Admin (if possible)
2. Login as Super Admin
3. **Expected Result:**
   - Super Admin sees all menus regardless
   - canSee() returns true for all items

**Verification:**
```javascript
// In Sidebar.tsx canSee function:
// Line: if (currentUserRole === 'Super Admin') return true;
// This should always execute before permission checks
```

### Test 7.2: Menu with No RBAC ID Mapping
**Steps:**
1. Add test menu item without menuNameToRbacId mapping
2. Assign to role
3. **Expected Result:**
   - Falls back to legacy allowedRoles check
   - No errors
   - Menu visibility works

### Test 7.3: Dashboard Accessible Despite Menu Restriction
**Steps:**
1. Uncheck "dashboard" menu for a role (if allowed)
2. Try to access via URL `/dashboard`
3. **Expected Result:**
   - Access allowed (dashboard always accessible)
   - User redirected from hidden menu but can access page directly

---

## Test Suite 8: Performance

### Test 8.1: Permission Check Speed
**Steps:**
1. Open DevTools → Performance tab
2. Record profile
3. Open permission manager
4. Toggle all menus (check/uncheck multiple times)
5. **Expected Result:**
   - No lag or stuttering
   - Checkbox updates < 50ms
   - UI remains responsive

### Test 8.2: Sidebar Render Performance
**Steps:**
1. With 20+ menu items
2. Toggle sidebar visibility multiple times
3. **Expected Result:**
   - Smooth animations
   - No frame drops
   - < 16ms render time

---

## Browser Compatibility Testing

| Browser | Version | Result | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | ✅ | Primary target |
| Firefox | Latest | ✅ | Secondary |
| Safari | Latest | ? | Not yet tested |
| Edge | Latest | ? | Not yet tested |

---

## Regression Testing

### After Sidebar Integration:
- [ ] All hardcoded role checks removed
- [ ] No "allowedRoles" warnings in console
- [ ] All roles see correct menus
- [ ] Super Admin sees all menus
- [ ] Partner role restrictions work

### After Feature Controls:
- [ ] Export buttons show/hide correctly
- [ ] Delete buttons show/hide correctly
- [ ] Status change buttons work
- [ ] Form edit buttons work

---

## Debugging Commands

### Check Current User Role
```javascript
const { data: { user } } = await supabase.auth.getUser();
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();
console.log(userData.role);
```

### Verify Permissions in Database
```javascript
const { data } = await supabase
  .from('settings')
  .select('rolePermissions')
  .eq('id', 'rolePermissions')
  .single();
console.log(JSON.stringify(data.rolePermissions, null, 2));
```

### Test Permission Check Function
```javascript
// In console on page with useRolePermissions
const ctx = // access to useRolePermissions somehow
ctx.canAccessMenu('products', 'Advertiser'); // true/false
ctx.canUseFeature('export_csv', 'Advertiser'); // true/false
```

### View All Menu IDs
```javascript
import { ALL_MENUS, ALL_FEATURES } from '../utils/rolePermissions';
console.table(ALL_MENUS.map(m => ({ id: m.id, name: m.name })));
console.table(ALL_FEATURES.map(f => ({ id: f.id, name: f.name })));
```

---

## Sign-Off

- [ ] All test suites passed
- [ ] No console errors
- [ ] No performance issues
- [ ] Documentation updated
- [ ] Ready for production

**Tester:** ____________  
**Date:** ____________  
**Notes:** ____________

