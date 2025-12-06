# RBAC System - Quick Reference Guide

## What is RBAC?
Role-Based Access Control (RBAC) allows Super Admins to configure which menus and features each user role can access. Instead of hardcoding permissions in the code, they're stored in the database and dynamically checked.

## Key Files

| File | Purpose |
|------|---------|
| `components/RolePermissionManager.tsx` | Modal UI for configuring role permissions |
| `contexts/RolePermissionsContext.tsx` | Global state for role permissions |
| `utils/rolePermissions.ts` | Menu/feature definitions and defaults |
| `pages/SettingsPage.tsx` | Integration point in Manajemen Peran tab |
| `App.tsx` | Provider setup |

## How to Use RBAC in Components

### 1. Check Menu Access
```typescript
import { useRolePermissions } from '../contexts/RolePermissionsContext';
import { getNormalizedRole } from '../utils';

const { canAccessMenu } = useRolePermissions();
const normalizedRole = getNormalizedRole(currentUser.role);

if (!canAccessMenu('products', normalizedRole)) {
  return <div>Access Denied</div>;
}
```

### 2. Check Feature Access
```typescript
const { canUseFeature } = useRolePermissions();

{canUseFeature('export_csv', normalizedRole) && (
  <button>📥 Export CSV</button>
)}
```

### 3. Load Permissions (Automatic)
Permissions automatically load when app starts and refresh every 5 minutes. No additional setup needed!

## Menu IDs
From `utils/rolePermissions.ts ALL_MENUS`:
- `dashboard` - Dashboard
- `products` - Products
- `orders` - Orders
- `customers` - Customers
- `reports` - Reports
- `ad_reports` - Ad Reports
- `earnings` - Earnings
- `settings` - Settings
- `role_management` - Role Management
- `user_management` - User Management
- `tracking` - Tracking Pixels
- `announcements` - Announcements
- etc.

## Feature IDs
From `utils/rolePermissions.ts ALL_FEATURES`:
- `export_csv` - Can export data
- `edit_form` - Can edit forms
- `delete_order` - Can delete orders
- `change_order_status` - Can change order status
- `view_earnings` - Can view earnings
- `manage_users` - Can manage users
- `manage_roles` - Can manage roles
- `view_reports` - Can view reports
- `edit_settings` - Can edit settings
- `sound_notifications` - Can toggle sound
- `manual_order_creation` - Can create orders manually

## Default Role Permissions

| Role | Key Menus | Key Features |
|------|-----------|--------------|
| **Super Admin** | All (22) | All (11) |
| **Admin** | Dashboard, Products, Orders, Customers, Reports, Earnings, Settings | Export CSV, Edit Form, Delete Order, Change Status, View Earnings, Manage Users, View Reports, Edit Settings |
| **Keuangan** | Dashboard, Orders, Customers, Reports, Earnings | Export CSV, View Earnings, View Reports |
| **Customer Service** | Dashboard, Orders, Customers, Earnings | Export CSV, Change Status, View Earnings, Sound Notifications, Create Orders |
| **Gudang** | Dashboard, Orders | Change Status, Sound Notifications |
| **Advertiser** | Dashboard, Products, Forms, Reports (Ad), Earnings | Export CSV, Edit Form, View Earnings, Sound Notifications |
| **Partner** | Dashboard, Reports (Ad) | View Reports |

## Configuration Steps

### As Super Admin:
1. Go to **Pengaturan** (Settings)
2. Select **Manajemen Peran** (Role Management)
3. Click **"Kelola Menu & Fitur"** on desired role
4. Check/uncheck menus and features
5. Click **"Simpan Izin"** (Save Permissions)
6. Toast confirms save

## Common Tasks

### Hide CSV Export for Role
```typescript
// In any page with export button
const { canUseFeature } = useRolePermissions();

if (!canUseFeature('export_csv', normalizedRole)) {
  // Don't show button
  return null;
}
```

### Restrict Menu for Role
```typescript
// In Sidebar.tsx canSee() function
const { canAccessMenu } = useRolePermissions();
const menuId = 'products'; // or other menu ID
return canAccessMenu(menuId, normalizedRole);
```

### Show Role-Specific Dashboard
```typescript
// In DashboardPage.tsx
const { canAccessMenu } = useRolePermissions();

if (normalizedRole === 'Advertiser') {
  return <AdvertiserDashboard />;
} else if (canAccessMenu('earnings', normalizedRole)) {
  return <FullDashboard />;
}
```

## Debugging

### Print Current Permissions (Browser Console)
```javascript
// Open browser DevTools → Console tab
// After importing useRolePermissions in a component and logging:
const context = useRolePermissions();
console.log('All Permissions:', context.rolePermissions);
console.log('Advertiser:', context.rolePermissions['Advertiser']);
console.log('Can Advertiser access products?', context.canAccessMenu('products', 'Advertiser'));
```

### Check if Permissions Loaded
```javascript
const { loading, error } = useRolePermissions();
if (loading) console.log('Permissions loading...');
if (error) console.log('Error:', error);
```

### Verify Role Normalization
```typescript
import { getNormalizedRole } from '../utils';

const raw = 'customer service';
console.log(getNormalizedRole(raw)); // Should output: 'Customer service'
```

## Storage Location
**Database:** Supabase PostgreSQL
**Table:** `settings`
**Key:** `rolePermissions`
**Type:** JSON object

## Refresh Strategy
- Permissions load automatically on app start
- Permissions refresh every 5 minutes (polling)
- Manual refresh: `const { refreshPermissions } = useRolePermissions(); await refreshPermissions();`

## Testing Checklist

- [ ] Super Admin sees all menus
- [ ] After unchecking menu, it disappears from sidebar
- [ ] Permission changes persist after logout/login
- [ ] Feature buttons show/hide correctly
- [ ] No console errors on restricted pages
- [ ] Each role sees only assigned menus
- [ ] Each role can only use assigned features

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Menu not disappearing after unchecking | Refresh page (requires Sidebar update) |
| Permissions not loading | Check browser Network tab, verify Supabase connection |
| Role name not recognized | Verify exact spelling and case in `DEFAULT_ROLE_PERMISSIONS` |
| Menu ID not working | Check ID matches `ALL_MENUS` ID field |
| Feature not hiding button | Verify feature ID matches `ALL_FEATURES` ID field |

## What's Coming Soon

- ✅ Permission configuration UI (Done)
- ✅ Global context provider (Done)
- 🔄 Sidebar dynamic checking (Next Sprint)
- 🔄 Feature-level UI controls (Next Sprint)
- 📋 Real-time permission updates
- 📋 Permission audit logs
- 📋 Permission templates for quick setup

## Additional Resources

- **Full Documentation:** `RBAC_SYSTEM_DOCUMENTATION.md`
- **Integration Guide:** `RBAC_INTEGRATION_STEPS.md`
- **Type Definitions:** See `types.ts` for `MenuAccess`, `RolePermissionMap`
- **Utilities:** See `utils/rolePermissions.ts` for constants

---

**Last Updated:** January 2024
**Status:** Core RBAC system complete ✅ | Sidebar integration in progress 🔄

