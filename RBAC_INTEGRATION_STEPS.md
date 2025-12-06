# RBAC Integration Implementation Steps

## Overview
This guide walks through integrating the new RBAC system into the existing pages and components, using dynamic permissions from the database instead of hardcoded access lists.

## Phase 1: Sidebar Integration ✅ (Ready to Implement)

### Step 1.1: Update Sidebar Component

**File:** `components/Sidebar.tsx`

**Objective:** Replace hardcoded `allowedRoles` arrays with dynamic permission checks.

**Current Implementation (Hardcoded):**
```typescript
const canSee = (page: Page) => {
  if (page.page === 'Produk') {
    const allowedRoles = ['Super Admin', 'Admin', 'Keuangan', 'Customer service', 'Gudang', 'Advertiser'];
    return allowedRoles.includes(normalizedRole);
  }
  // ... more hardcoded checks
};
```

**New Implementation (Dynamic):**
```typescript
import { useRolePermissions } from '../contexts/RolePermissionsContext';

// Add near top of component
const { canAccessMenu } = useRolePermissions();

// Create menu ID map
const menuIdMap: Record<string, string> = {
  'Produk': 'products',
  'Pesanan': 'orders',
  'Pelanggan': 'customers',
  'Laporan': 'reports',
  'Penghasilan': 'earnings',
  'Pengaturan': 'settings',
  // ... map all menu names to IDs from rolePermissions.ts
};

const canSee = (page: Page): boolean => {
  const menuId = menuIdMap[page.page];
  if (!menuId) return false; // Default deny if menu ID not found
  
  const normalizedRole = getNormalizedRole(currentUser.role);
  return canAccessMenu(menuId, normalizedRole);
};
```

**Changes Required:**
1. Import `useRolePermissions` hook at top
2. Replace all hardcoded `allowedRoles` arrays with `canAccessMenu()` calls
3. Create comprehensive `menuIdMap` matching all sidebar pages
4. Test each menu appears/disappears based on permission changes

**Testing Checklist:**
- [ ] Super Admin sees all menus
- [ ] Admin sees correct menu subset
- [ ] Advertiser sees only: Dashboard, Produk, Laporan, Penghasilan
- [ ] Customer service sees correct menus
- [ ] Menu disappears immediately when permissions updated (requires page refresh currently)

---

## Phase 2: Feature-Level Access Control

### Step 2.1: Update OrdersPage - CSV Export Feature

**File:** `pages/OrdersPage.tsx`

**Objective:** Show/hide CSV export button based on `export_csv` feature permission.

**Implementation:**
```typescript
import { useRolePermissions } from '../contexts/RolePermissionsContext';

export const OrdersPage: React.FC = () => {
  const { canUseFeature } = useRolePermissions();
  const currentUser = useContext(AuthContext)?.user; // or get from props
  
  const normalizedRole = getNormalizedRole(currentUser?.role);
  const canExportCsv = canUseFeature('export_csv', normalizedRole);

  return (
    <div>
      {/* ... existing code ... */}
      
      {canExportCsv && (
        <button onClick={handleExportCsv} className="...">
          📥 Export CSV
        </button>
      )}
    </div>
  );
};
```

**Features to Control:**
- CSV export buttons (order lists, customer lists, reports)
- Delete buttons → `delete_order` feature
- Status change buttons → `change_order_status` feature
- Commission editing → `edit_commission` feature
- User management UI → `manage_users` feature
- Form creation/editing → `edit_form` feature

---

## Phase 3: Dashboard Page Customization

### Step 3.1: Role-Specific Dashboard Content

**File:** `pages/DashboardPage.tsx` (Already has some Advertiser customization)

**Objective:** Show role-appropriate widgets and metrics.

**Current State:** Advertiser gets custom welcome card and metrics

**Enhancements:**
```typescript
const { canAccessMenu, canUseFeature } = useRolePermissions();

// Show different widgets based on role permissions
const shouldShowOrderMetrics = canAccessMenu('orders', normalizedRole);
const shouldShowEarningsMetrics = canAccessMenu('earnings', normalizedRole);
const shouldShowReports = canAccessMenu('reports', normalizedRole);

return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {shouldShowOrderMetrics && <OrderMetricsWidget />}
    {shouldShowEarningsMetrics && <EarningsMetricsWidget />}
    {shouldShowReports && <ReportsSummaryWidget />}
  </div>
);
```

---

## Phase 4: Settings Page - Role Permissions Editor

### Step 4.1: Test Permission Manager Modal

**File:** `pages/SettingsPage.tsx` (Already integrated)

**What's Already Done:**
✅ RolePermissionManager component created
✅ "Kelola Menu & Fitur" button added to role cards
✅ Modal displays all menus and features with checkboxes
✅ Permissions saved to database

**Manual Testing:**
1. Login as Super Admin
2. Navigate to Pengaturan → Manajemen Peran
3. Click "Kelola Menu & Fitur" on any role
4. Verify modal opens
5. Select/deselect menus and features
6. Click "Simpan Izin"
7. Verify success toast shows
8. Refresh page - permissions should persist

---

## Phase 5: Real-Time Permission Updates

### Step 5.1: Add Permission Change Broadcast

**Objective:** When permissions are updated, notify logged-in users to refresh their view.

**Option A: Polling (Simple)**
Already implemented in RolePermissionsContext - refreshes every 5 minutes.

**Option B: Realtime (Advanced)**
```typescript
// In RolePermissionsContext useEffect after loading
const subscription = supabase
  .from('settings')
  .on('*', payload => {
    if (payload.new.id === 'rolePermissions') {
      // Refresh permissions when database changes
      loadPermissions();
    }
  })
  .subscribe();

return () => subscription.unsubscribe();
```

---

## Implementation Priority

### Week 1: Core RBAC
1. ✅ Type definitions and utility
2. ✅ RolePermissionManager component
3. ✅ RolePermissionsContext provider
4. 🔄 Sidebar dynamic checking (NEXT)
5. 🔄 Dashboard role customization

### Week 2: Feature Controls
6. Order management feature checks (delete, status change)
7. Form management feature checks (edit, create)
8. User management feature checks

### Week 3: Polish
9. Real-time permission broadcasts
10. Permission history/audit log
11. E2E testing suite

---

## Common Patterns

### Pattern 1: Check Menu Access
```typescript
const { canAccessMenu } = useRolePermissions();
const normalizedRole = getNormalizedRole(currentUser.role);

if (!canAccessMenu('orders', normalizedRole)) {
  return <AccessDenied />;
}
```

### Pattern 2: Conditional Render Button
```typescript
const { canUseFeature } = useRolePermissions();

{canUseFeature('export_csv', normalizedRole) && (
  <button onClick={handleExport}>Export</button>
)}
```

### Pattern 3: Hide Entire Section
```typescript
const { canAccessMenu } = useRolePermissions();

{canAccessMenu('earnings', normalizedRole) && (
  <EarningsSection />
)}
```

---

## Debugging

### Check Current Permissions
```typescript
// In browser console:
const { rolePermissions } = useRolePermissions();
console.log(rolePermissions);

// Check specific role
console.log(rolePermissions['Advertiser']);
```

### Verify Menu ID Mapping
```typescript
import { ALL_MENUS } from '../utils/rolePermissions';
console.log(ALL_MENUS.map(m => ({ id: m.id, name: m.name })));
```

### Test Permission Check
```typescript
const { canAccessMenu, canUseFeature } = useRolePermissions();
console.log(canAccessMenu('products', 'Advertiser')); // true/false
console.log(canUseFeature('export_csv', 'Customer service')); // true/false
```

---

## Database Schema

### Current Storage
**Table:** `settings`
**Key:** `rolePermissions`
**Type:** `jsonb`

**Example Value:**
```json
{
  "Advertiser": {
    "menus": ["dashboard", "products", "form_list", "reports", "ad_reports", "earnings"],
    "features": ["export_csv", "edit_form", "view_earnings", "sound_notifications"],
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "Customer service": {
    "menus": ["dashboard", "orders", "order_list", "abandoned_carts", "customers", "earnings"],
    "features": ["export_csv", "change_order_status", "view_earnings", "sound_notifications", "manual_order_creation"],
    "updatedAt": "2024-01-15T10:25:00Z"
  }
}
```

### Future: Dedicated Table
```sql
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL UNIQUE,
  menus TEXT[] NOT NULL,
  features TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_role_permissions_role_name ON role_permissions(role_name);
```

---

## Integration Checklist

- [ ] Sidebar uses dynamic permissions (Phase 1)
- [ ] Dashboard shows role-appropriate content (Phase 3)
- [ ] CSV export button checks feature permission (Phase 2)
- [ ] Delete buttons check feature permission (Phase 2)
- [ ] Form editing checks feature permission (Phase 2)
- [ ] Status change buttons check feature permission (Phase 2)
- [ ] Permission updates persist in database
- [ ] Pages refresh to reflect permission changes
- [ ] No console errors when accessing restricted pages
- [ ] Audit log tracks permission changes (Phase 3+)
- [ ] E2E tests for each role's menu access
- [ ] E2E tests for feature permission enforcement

---

## Notes

- All role names are case-sensitive in database matches
- Menu IDs use snake_case in rolePermissions.ts
- Feature IDs use snake_case in rolePermissions.ts
- Default permissions provide sensible baseline
- Super Admin always has all permissions
- Partner role has most restricted access
- Advertiser role can manage forms and track ad metrics
- Customer service role focused on order management

