# Role-Based Access Control (RBAC) System Documentation

## Overview

The Order Management Dashboard now features a comprehensive Role-Based Access Control (RBAC) system that allows Super Admins to dynamically configure which menus and features are accessible to each user role.

## Architecture

### Components

#### 1. **RolePermissionManager Component**
Location: `components/RolePermissionManager.tsx`

Interactive modal dialog for configuring role permissions with:
- **Menu Checklist**: 22 menu items with descriptions and icons
- **Feature Checklist**: 11 feature flags with descriptions
- **Select All/Deselect All**: Quick buttons to toggle all items
- **Summary Display**: Shows total menus and features selected
- **Responsive Grid**: 3-column layout on large screens, 2-column on tablets, 1-column on mobile

**Props:**
```typescript
interface RolePermissionManagerProps {
  roleName: string;                    // Name of the role being configured
  onClose: () => void;                 // Called when user clicks Cancel/X
  onSave: (roleName: string, menuIds: string[], featureIds: string[]) => Promise<void>;
}
```

#### 2. **Menu Definitions**
Location: `utils/rolePermissions.ts`

**ALL_MENUS Array:**
22 available menus with IDs, names, and descriptions:
- `dashboard` - Dashboard Utama
- `customers` - Daftar Pelanggan
- `orders` - Semua Pesanan
- `form_settings` - Pengaturan Formulir
- `form_list` - Daftar Formulir
- `products` - Daftar Produk
- `product_categories` - Kategori Produk
- `brands` - Manajemen Brand
- `induk_produk` - Produk Induk (INDUK_PRODUK)
- `reports` - Laporan Semua Pesanan
- `ad_reports` - Laporan Iklan
- `sales_reports` - Laporan Penjualan
- `earnings` - Penghasilan
- `pending_users` - Pengguna Menunggu Persetujuan
- `users` - Daftar Pengguna
- `roles` - Manajemen Peran
- `abandoned_carts` - Keranjang Ditinggalkan
- `tracking` - Pengaturan Tracking Pixel
- `website_settings` - Pengaturan Website
- `announcements` - Pengumuman
- `customer_service` - Pengaturan Customer Service
- `deletion_requests` - Permintaan Penghapusan Data

**ALL_FEATURES Array:**
11 feature flags for fine-grained control:
- `export_csv` - Ekspor Data CSV
- `edit_form` - Edit Formulir
- `delete_order` - Hapus Pesanan
- `change_order_status` - Ubah Status Pesanan
- `view_earnings` - Lihat Penghasilan
- `manage_users` - Manajemen Pengguna
- `sound_notifications` - Notifikasi Suara
- `create_form` - Buat Formulir Baru
- `edit_commission` - Edit Komisi
- `manage_roles` - Manajemen Peran & Izin
- `reset_password` - Reset Password Pengguna

#### 3. **Default Role Permissions**
Location: `utils/rolePermissions.ts`

`DEFAULT_ROLE_PERMISSIONS` object provides sensible defaults:

```typescript
{
  'Super Admin': {
    menus: [all 22 menus],
    features: [all 11 features]
  },
  'Admin': {
    menus: [dashboard, customers, orders, form_settings, form_list, products, ...],
    features: [export_csv, edit_form, delete_order, ...]
  },
  'Advertiser': {
    menus: [dashboard, products, form_list, reports, ad_reports, earnings],
    features: [export_csv, edit_form, view_earnings, sound_notifications]
  },
  // ... other roles
}
```

### Data Flow

```
SettingsPage (Manajemen Peran)
    ↓
    [Role Cards with "Kelola Menu & Fitur" button]
    ↓
RolePermissionManager (modal)
    ↓
    [Select menus and features]
    ↓
    handleSavePermissions()
    ↓
    Supabase settings table (rolePermissions JSON)
    ↓
    [Broadcast to all logged-in users via Context]
    ↓
    Sidebar / Pages update dynamic visibility
```

### Storage

**Location:** `settings` table in Supabase

**Key:** `rolePermissions`

**Value:** JSON object
```json
{
  "Advertiser": {
    "menus": ["dashboard", "products", "form_list", ...],
    "features": ["export_csv", "edit_form", ...],
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "Customer service": {
    "menus": ["dashboard", "orders", "customers", ...],
    "features": ["export_csv", "change_order_status", ...],
    "updatedAt": "2024-01-15T10:25:00Z"
  }
}
```

## User Flows

### Configuration Flow (Super Admin)

1. Navigate to **Pengaturan** > **Manajemen Peran**
2. Click **"Kelola Menu & Fitur"** button on desired role card
3. In the modal:
   - Browse available menus with descriptions
   - Check/uncheck menus as needed
   - Use "Pilih Semua Menu" to quickly select all
   - Repeat for Features section
   - Review summary showing total selected
4. Click **"Simpan Izin"** button
5. Success toast confirms save: "Izin untuk peran 'X' berhasil disimpan"

### Access Control Flow (User)

1. User logs in with role (e.g., "Advertiser")
2. App loads role permissions from Supabase `settings` table
3. Sidebar dynamically renders only allowed menus
4. Pages check feature permissions before rendering buttons/actions
5. If user tries to access hidden menu via URL: redirected to Dashboard

## Implementation Guide

### Step 1: Load Permissions on App Start

**Location:** `App.tsx` or relevant context initialization

```typescript
const loadRolePermissions = async () => {
  const { data } = await supabase.from('settings')
    .select('rolePermissions')
    .eq('id', 'rolePermissions')
    .single();
  
  const permissions = data?.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
  // Store in Context for access throughout app
  setRolePermissions(permissions);
};
```

### Step 2: Update Sidebar Dynamic Checking

**Location:** `components/Sidebar.tsx`

Current implementation with hardcoded `allowedRoles`:
```typescript
const canSee = (page: Page) => {
  if (page.page === 'Produk') {
    const allowedRoles = ['Super Admin', 'Admin', 'Keuangan', 'Customer service', 'Gudang', 'Advertiser'];
    return allowedRoles.includes(normalizedRole);
  }
  // ...
};
```

**New implementation with dynamic permissions:**
```typescript
const canSee = (page: Page) => {
  const normalizedRole = getNormalizedRole(currentUser.role);
  const rolePermissions = useRolePermissions(); // From Context
  const allowedMenus = rolePermissions[normalizedRole]?.menus || [];
  
  // Map page to menu ID
  const menuId = menuPageMap[page.page];
  return allowedMenus.includes(menuId);
};
```

### Step 3: Add Feature Permission Checks

**Example:** Hide "Export CSV" button unless user has `export_csv` feature

```typescript
const { canUseFeature } = useRolePermissions();

if (!canUseFeature('export_csv')) {
  return null; // Don't render Export button
}
```

### Step 4: Create RolePermissionsContext

**New file:** `contexts/RolePermissionsContext.tsx`

```typescript
interface RolePermissionsContextType {
  rolePermissions: RolePermissionMap;
  loading: boolean;
  error: string | null;
  canAccessMenu: (menuId: string, userRole: string) => boolean;
  canUseFeature: (featureId: string, userRole: string) => boolean;
}

export const RolePermissionsContext = createContext<RolePermissionsContextType | null>(null);

export const useRolePermissions = () => {
  const context = useContext(RolePermissionsContext);
  if (!context) {
    throw new Error('useRolePermissions must be used within RolePermissionsProvider');
  }
  return context;
};
```

## Troubleshooting

### Permissions not taking effect
1. **Check browser cache**: Clear localStorage and reload
2. **Verify database**: Check `settings` table for `rolePermissions` entry
3. **Verify role name**: Ensure role name in permission matches exactly (case-sensitive)
4. **Check user role**: Verify `users.role` field matches expected value

### Menu still showing after unchecking
1. **Sidebar not updated**: Verify `Sidebar.tsx` using dynamic permissions
2. **Context not initialized**: Check `App.tsx` provider setup
3. **Stale state**: Ensure Context is properly refreshing on permission changes

### Performance issues
1. **Too many DB calls**: Cache permissions in Context and refresh on interval
2. **Large permission objects**: Limit menu/feature count or paginate
3. **N+1 queries**: Load all role permissions once, not per-user

## Future Enhancements

1. **Granular UI Elements**: Permission checks for buttons, modals, forms
   - "Delete" button only if `delete_order` feature enabled
   - "Edit Commission" modal only if `edit_commission` enabled

2. **API Route Protection**: Backend validation of permissions
   - All API calls verify user has required feature before executing

3. **Permission Templates**: Preset combinations for common role configs
   - "Read-Only Partner": Only Dashboard and view Reports
   - "Full CS Agent": All CS-relevant menus and order management

4. **Audit Log**: Track permission changes
   - Who changed permissions for which role and when
   - Rollback capability

5. **Time-Based Permissions**: Temporary access grants
   - Elevate user permissions for specific time period
   - Automatically reverts after expiration

6. **Dynamic Role Creation**: Allow custom roles
   - Instead of fixed 7 roles, create unlimited custom roles
   - Base permissions on templates

## Related Files

- `components/RolePermissionManager.tsx` - Permission checklist modal
- `utils/rolePermissions.ts` - Menu/feature definitions and defaults
- `types.ts` - MenuAccess, RolePermissionMap types
- `pages/SettingsPage.tsx` - Integration with Manajemen Peran tab
- `components/Sidebar.tsx` - (to be updated) Dynamic menu visibility
- `App.tsx` - (to be updated) Provider setup

## Testing Checklist

- [ ] Super Admin can access permission manager
- [ ] Can select/deselect individual menus
- [ ] Can select/deselect individual features
- [ ] "Select All" buttons work for both menus and features
- [ ] Summary shows correct count after selections
- [ ] Permissions save to database
- [ ] Toast shows success message
- [ ] Modal closes after save
- [ ] Other roles see updated permissions (requires page refresh currently)
- [ ] Permissions persist after logout/login
- [ ] Menu items disappear/reappear based on permissions
- [ ] Feature buttons show/hide correctly
