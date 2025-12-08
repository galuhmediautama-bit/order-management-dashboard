// Type definitions for role permissions
export interface MenuAccess {
  menus: string[];
  features: string[];
}

export type RolePermissionMap = Record<string, MenuAccess>;

// All available menus and features for role-based access control
export const ALL_MENUS = [
  { id: 'dashboard', name: 'Dasbor', category: 'menu', description: 'Dashboard Analytics' },
  { id: 'products', name: 'Produk', category: 'menu', description: 'Product Management' },
  { id: 'product_list', name: 'Daftar Produk', category: 'submenu', description: 'View and manage products' },
  { id: 'form_list', name: 'Daftar Formulir', category: 'submenu', description: 'View and manage forms' },
  { id: 'orders', name: 'Pesanan', category: 'menu', description: 'Order Management' },
  { id: 'order_list', name: 'Daftar Pesanan', category: 'submenu', description: 'View orders' },
  { id: 'abandoned_carts', name: 'Pesanan Tertinggal', category: 'submenu', description: 'View abandoned carts' },
  { id: 'customers', name: 'Pelanggan', category: 'menu', description: 'Customer Management' },
  { id: 'reports', name: 'Laporan', category: 'menu', description: 'Reports & Analytics' },
  { id: 'ad_reports', name: 'Laporan Iklan', category: 'submenu', description: 'Ad campaign reports' },
  { id: 'cs_reports', name: 'Laporan CS', category: 'submenu', description: 'Customer service reports' },
  { id: 'earnings', name: 'Penghasilan', category: 'menu', description: 'Earnings & Commission' },
  { id: 'settings', name: 'Pengaturan', category: 'menu', description: 'System Settings' },
  { id: 'website_settings', name: 'Pengaturan Website', category: 'submenu', description: 'Website configuration' },
  { id: 'user_management', name: 'Manajemen Pengguna', category: 'submenu', description: 'Manage users' },
  { id: 'role_management', name: 'Manajemen Peran', category: 'submenu', description: 'Manage roles' },
  { id: 'brands', name: 'Merek', category: 'submenu', description: 'Brand management' },
  { id: 'cs_management', name: 'Manajemen CS', category: 'submenu', description: 'Customer service management' },
  { id: 'tracking', name: 'Pelacakan', category: 'submenu', description: 'Tracking & pixels' },
  { id: 'announcements', name: 'Pengumuman', category: 'submenu', description: 'Announcements' },
  { id: 'deletion_requests', name: 'Permintaan Hapus', category: 'submenu', description: 'Data deletion requests' },
  { id: 'cuan_rank', name: 'CuanRank', category: 'submenu', description: 'Rank settings' },
] as const;

export const ALL_FEATURES = [
  { id: 'export_csv', name: 'Export CSV', category: 'feature', description: 'Can export data to CSV' },
  { id: 'edit_product', name: 'Edit Product', category: 'feature', description: 'Can create and edit products' },
  { id: 'delete_product', name: 'Delete Product', category: 'feature', description: 'Can delete products' },
  { id: 'edit_form', name: 'Edit Form', category: 'feature', description: 'Can create and edit forms' },
  { id: 'delete_order', name: 'Delete Order', category: 'feature', description: 'Can delete orders' },
  { id: 'change_order_status', name: 'Change Order Status', category: 'feature', description: 'Can update order status' },
  { id: 'view_earnings', name: 'View Earnings', category: 'feature', description: 'Can view earnings' },
  { id: 'manage_users', name: 'Manage Users', category: 'feature', description: 'Can manage user accounts' },
  { id: 'manage_roles', name: 'Manage Roles', category: 'feature', description: 'Can manage roles and permissions' },
  { id: 'view_reports', name: 'View Reports', category: 'feature', description: 'Can view all reports' },
  { id: 'edit_settings', name: 'Edit Settings', category: 'feature', description: 'Can edit system settings' },
  { id: 'sound_notifications', name: 'Sound Notifications', category: 'feature', description: 'Can toggle notification sounds' },
  { id: 'manual_order_creation', name: 'Manual Order Creation', category: 'feature', description: 'Can manually create orders' },
  { id: 'view_sales_stats', name: 'View Sales Stats', category: 'feature', description: 'Can view sales statistics on dashboard' },
  { id: 'view_charts', name: 'View Charts', category: 'feature', description: 'Can view sales and order charts' },
  { id: 'view_top_products', name: 'View Top Products', category: 'feature', description: 'Can view top products ranking' },
  { id: 'view_top_advertisers', name: 'View Top Advertisers', category: 'feature', description: 'Can view top advertisers ranking' },
  { id: 'view_top_cs', name: 'View Top CS', category: 'feature', description: 'Can view top CS ranking' },
  { id: 'view_recent_orders', name: 'View Recent Orders', category: 'feature', description: 'Can view recent orders on dashboard' },
] as const;

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS = {
  'Super Admin': {
    menus: ALL_MENUS.map(m => m.id),
    features: ALL_FEATURES.map(f => f.id),
  },
  'Admin': {
    menus: [
      'dashboard', 'products', 'product_list', 'form_list', 'orders', 'order_list',
      'abandoned_carts', 'customers', 'reports', 'ad_reports', 'cs_reports', 'earnings',
      'settings', 'website_settings', 'user_management', 'brands', 'cs_management', 'tracking', 'announcements'
    ],
    features: [
      'export_csv', 'edit_product', 'edit_form', 'delete_order', 'change_order_status', 'view_earnings',
      'manage_users', 'view_reports', 'edit_settings', 'sound_notifications', 'manual_order_creation',
      'view_sales_stats', 'view_charts', 'view_top_products', 'view_top_advertisers', 'view_top_cs', 'view_recent_orders'
    ],
  },
  'Keuangan': {
    menus: ['dashboard', 'orders', 'order_list', 'customers', 'reports', 'cs_reports', 'earnings'],
    features: ['export_csv', 'view_earnings', 'view_reports', 'view_sales_stats', 'view_charts', 'view_top_cs', 'view_recent_orders'],
  },
  'Customer service': {
    menus: ['dashboard', 'orders', 'order_list', 'abandoned_carts', 'customers', 'earnings'],
    features: ['export_csv', 'change_order_status', 'view_earnings', 'sound_notifications', 'manual_order_creation', 'view_sales_stats', 'view_recent_orders'],
  },
  'Gudang': {
    menus: ['dashboard', 'orders', 'order_list'],
    features: ['change_order_status', 'sound_notifications', 'view_recent_orders'],
  },
  'Advertiser': {
    menus: ['dashboard', 'products', 'form_list', 'reports', 'ad_reports', 'earnings'],
    features: ['export_csv', 'edit_product', 'edit_form', 'view_earnings', 'sound_notifications', 'view_sales_stats', 'view_charts', 'view_top_products'],
  },
  'Partner': {
    menus: ['dashboard', 'reports', 'ad_reports'],
    features: ['view_reports', 'view_sales_stats', 'view_charts'],
  },
};
