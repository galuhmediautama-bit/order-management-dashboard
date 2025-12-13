// Type definitions for role permissions
export interface MenuAccess {
  menus: string[];
  features: string[];
}

export type RolePermissionMap = Record<string, MenuAccess>;

// All available menus and features for role-based access control
export const ALL_MENUS = [
  // Main Menus
  { id: 'dashboard', name: 'Dasbor', category: 'menu', description: 'Dashboard Analytics' },

  // Produk Menu Group
  { id: 'products', name: 'Produk', category: 'menu', description: 'Product Management' },
  { id: 'product_list', name: 'Daftar Produk', category: 'submenu', description: 'Lihat dan kelola produk' },
  { id: 'form_list', name: 'Daftar Formulir', category: 'submenu', description: 'Lihat dan kelola formulir order' },
  { id: 'landing_page', name: 'Landing Page', category: 'submenu', description: 'Kelola landing page produk' },

  // Pesanan Menu Group
  { id: 'orders', name: 'Pesanan', category: 'menu', description: 'Order Management' },
  { id: 'order_list', name: 'Daftar Pesanan', category: 'submenu', description: 'Lihat dan kelola pesanan' },
  { id: 'abandoned_carts', name: 'Pesanan Tertinggal', category: 'submenu', description: 'Lihat keranjang yang ditinggalkan' },

  // Pelanggan
  { id: 'customers', name: 'Pelanggan', category: 'menu', description: 'Customer Management' },

  // Laporan Menu Group
  { id: 'reports', name: 'Laporan', category: 'menu', description: 'Reports & Analytics' },
  { id: 'ad_reports', name: 'Laporan Iklan', category: 'submenu', description: 'Laporan performa iklan' },
  { id: 'cs_reports', name: 'Laporan CS', category: 'submenu', description: 'Laporan customer service' },
  { id: 'stock_reports', name: 'Laporan Stock', category: 'submenu', description: 'Laporan stok produk' },
  { id: 'finance_reports', name: 'Laporan Keuangan', category: 'submenu', description: 'Laporan keuangan' },

  // Penghasilan
  { id: 'earnings', name: 'Penghasilan', category: 'menu', description: 'Komisi & Penghasilan' },

  // Pengaturan Menu Group
  { id: 'settings', name: 'Pengaturan', category: 'menu', description: 'System Settings' },
  { id: 'website_settings', name: 'Website', category: 'submenu', description: 'Konfigurasi website' },
  { id: 'brands', name: 'Merek', category: 'submenu', description: 'Kelola merek/brand' },
  { id: 'user_management', name: 'Pengguna', category: 'submenu', description: 'Kelola pengguna' },
  { id: 'role_management', name: 'Peran', category: 'submenu', description: 'Kelola izin role' },
  { id: 'cs_management', name: 'Customer Service', category: 'submenu', description: 'Kelola tim CS' },
  { id: 'cuan_rank', name: 'CuanRank', category: 'submenu', description: 'Pengaturan ranking' },
  { id: 'tracking', name: 'Pelacakan', category: 'submenu', description: 'Pixel tracking' },
  { id: 'error_logs', name: 'Log Error', category: 'submenu', description: 'Monitor error sistem' },
  { id: 'performance_dashboard', name: 'Performa', category: 'submenu', description: 'Dashboard performa sistem' },

  // Hidden/Legacy (for backward compatibility)
  { id: 'announcements', name: 'Pengumuman', category: 'submenu', description: 'Pengumuman sistem' },
  { id: 'deletion_requests', name: 'Permintaan Hapus', category: 'submenu', description: 'Permintaan penghapusan data' },
] as const;

export const ALL_FEATURES = [
  // Data Export
  { id: 'export_csv', name: 'Export CSV', category: 'feature', description: 'Dapat export data ke CSV' },

  // Product Management
  { id: 'edit_product', name: 'Edit Produk', category: 'feature', description: 'Dapat membuat dan edit produk' },
  { id: 'delete_product', name: 'Hapus Produk', category: 'feature', description: 'Dapat menghapus produk' },
  { id: 'edit_form', name: 'Edit Formulir', category: 'feature', description: 'Dapat membuat dan edit formulir' },
  { id: 'edit_landing_page', name: 'Edit Landing Page', category: 'feature', description: 'Dapat membuat dan edit landing page' },

  // Order Management
  { id: 'delete_order', name: 'Hapus Pesanan', category: 'feature', description: 'Dapat menghapus pesanan' },
  { id: 'change_order_status', name: 'Ubah Status Pesanan', category: 'feature', description: 'Dapat mengubah status pesanan' },
  { id: 'manual_order_creation', name: 'Buat Pesanan Manual', category: 'feature', description: 'Dapat membuat pesanan secara manual' },

  // Financial
  { id: 'view_earnings', name: 'Lihat Penghasilan', category: 'feature', description: 'Dapat melihat penghasilan' },

  // User & Role Management
  { id: 'manage_users', name: 'Kelola Pengguna', category: 'feature', description: 'Dapat mengelola akun pengguna' },
  { id: 'manage_roles', name: 'Kelola Peran', category: 'feature', description: 'Dapat mengelola role dan izin' },

  // Reports
  { id: 'view_reports', name: 'Lihat Laporan', category: 'feature', description: 'Dapat melihat semua laporan' },

  // Settings
  { id: 'edit_settings', name: 'Edit Pengaturan', category: 'feature', description: 'Dapat mengedit pengaturan sistem' },
  { id: 'manage_tracking', name: 'Kelola Pelacakan', category: 'feature', description: 'Dapat mengelola pixel tracking' },

  // Dashboard Widgets
  { id: 'view_sales_stats', name: 'Lihat Statistik Penjualan', category: 'feature', description: 'Dapat melihat statistik penjualan di dashboard' },
  { id: 'view_charts', name: 'Lihat Grafik', category: 'feature', description: 'Dapat melihat grafik penjualan dan pesanan' },
  { id: 'view_top_products', name: 'Lihat Top Produk', category: 'feature', description: 'Dapat melihat ranking produk terlaris' },
  { id: 'view_top_advertisers', name: 'Lihat Top Advertiser', category: 'feature', description: 'Dapat melihat ranking advertiser terbaik' },
  { id: 'view_top_cs', name: 'Lihat Top CS', category: 'feature', description: 'Dapat melihat ranking CS terbaik' },
  { id: 'view_recent_orders', name: 'Lihat Pesanan Terbaru', category: 'feature', description: 'Dapat melihat pesanan terbaru di dashboard' },

  // System
  { id: 'sound_notifications', name: 'Notifikasi Suara', category: 'feature', description: 'Dapat mengaktifkan notifikasi suara' },
  { id: 'manage_error_logs', name: 'Kelola Log Error', category: 'feature', description: 'Dapat melihat dan mengelola log error' },
  { id: 'view_performance', name: 'Lihat Performa', category: 'feature', description: 'Dapat melihat dashboard performa sistem' },
] as const;

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS = {
  'Super Admin': {
    menus: ALL_MENUS.map(m => m.id),
    features: ALL_FEATURES.map(f => f.id),
  },
  'Admin': {
    menus: [
      'dashboard',
      'products', 'product_list', 'form_list', 'landing_page',
      'orders', 'order_list', 'abandoned_carts',
      'customers',
      'reports', 'ad_reports', 'cs_reports', 'stock_reports', 'finance_reports',
      'earnings',
      'settings', 'website_settings', 'brands', 'user_management', 'cs_management', 'tracking', 'announcements', 'cuan_rank'
    ],
    features: [
      'export_csv', 'edit_product', 'edit_form', 'edit_landing_page',
      'delete_order', 'change_order_status', 'manual_order_creation',
      'view_earnings', 'manage_users', 'view_reports', 'edit_settings', 'manage_tracking',
      'view_sales_stats', 'view_charts', 'view_top_products', 'view_top_advertisers', 'view_top_cs', 'view_recent_orders',
      'sound_notifications'
    ],
  },
  'Keuangan': {
    menus: [
      'dashboard',
      'orders', 'order_list',
      'customers',
      'reports', 'cs_reports', 'finance_reports',
      'earnings'
    ],
    features: [
      'export_csv', 'view_earnings', 'view_reports',
      'view_sales_stats', 'view_charts', 'view_top_cs', 'view_recent_orders'
    ],
  },
  'Customer service': {
    menus: [
      'dashboard',
      'orders', 'order_list', 'abandoned_carts',
      'customers',
      'earnings'
    ],
    features: [
      'export_csv', 'change_order_status', 'manual_order_creation',
      'view_earnings',
      'view_sales_stats', 'view_recent_orders',
      'sound_notifications'
    ],
  },
  'Gudang': {
    menus: [
      'dashboard',
      'orders', 'order_list',
      'reports', 'stock_reports'
    ],
    features: [
      'change_order_status',
      'view_recent_orders',
      'sound_notifications'
    ],
  },
  'Advertiser': {
    menus: [
      'dashboard',
      'products', 'product_list', 'form_list', 'landing_page',
      'reports', 'ad_reports',
      'earnings'
    ],
    features: [
      'export_csv', 'edit_product', 'edit_form', 'edit_landing_page',
      'view_earnings',
      'view_sales_stats', 'view_charts', 'view_top_products',
      'sound_notifications'
    ],
  },
  'Partner': {
    menus: [
      'dashboard',
      'reports', 'ad_reports'
    ],
    features: [
      'view_reports',
      'view_sales_stats', 'view_charts'
    ],
  },
};
