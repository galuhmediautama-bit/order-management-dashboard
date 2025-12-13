import React, { useState, useEffect, useMemo } from 'react';
import { ALL_MENUS, ALL_FEATURES, DEFAULT_ROLE_PERMISSIONS } from '../utils/rolePermissions';
import { supabase } from '../firebase';
import XIcon from './icons/XIcon';
import CheckCircleFilledIcon from './icons/CheckCircleFilledIcon';

interface RolePermissionManagerProps {
  roleName: string;
  onClose: () => void;
  onSave: (roleName: string, menuIds: string[], featureIds: string[]) => Promise<void>;
}

// Group menus by category
const MENU_GROUPS = [
  { 
    id: 'main', 
    name: '📊 Menu Utama', 
    items: ['dashboard'] 
  },
  { 
    id: 'products', 
    name: '📦 Produk', 
    items: ['products', 'product_list', 'form_list', 'landing_page'] 
  },
  { 
    id: 'orders', 
    name: '🛒 Pesanan', 
    items: ['orders', 'order_list', 'abandoned_carts'] 
  },
  { 
    id: 'customers', 
    name: '👥 Pelanggan', 
    items: ['customers'] 
  },
  { 
    id: 'reports', 
    name: '📈 Laporan', 
    items: ['reports', 'ad_reports', 'cs_reports', 'stock_reports', 'finance_reports'] 
  },
  { 
    id: 'earnings', 
    name: '💰 Penghasilan', 
    items: ['earnings'] 
  },
  { 
    id: 'settings', 
    name: '⚙️ Pengaturan', 
    items: ['settings', 'website_settings', 'brands', 'user_management', 'role_management', 'cs_management', 'cuan_rank', 'tracking', 'error_logs', 'performance_dashboard', 'announcements', 'deletion_requests'] 
  },
];

// Group features by category
const FEATURE_GROUPS = [
  { 
    id: 'data', 
    name: '📄 Export Data', 
    items: ['export_csv'] 
  },
  { 
    id: 'product_mgmt', 
    name: '📦 Manajemen Produk', 
    items: ['edit_product', 'delete_product', 'edit_form', 'edit_landing_page'] 
  },
  { 
    id: 'order_mgmt', 
    name: '🛒 Manajemen Pesanan', 
    items: ['delete_order', 'change_order_status', 'manual_order_creation'] 
  },
  { 
    id: 'financial', 
    name: '💰 Keuangan', 
    items: ['view_earnings'] 
  },
  { 
    id: 'user_mgmt', 
    name: '👤 Manajemen User & Role', 
    items: ['manage_users', 'manage_roles'] 
  },
  { 
    id: 'reports', 
    name: '📈 Laporan', 
    items: ['view_reports'] 
  },
  { 
    id: 'settings', 
    name: '⚙️ Pengaturan', 
    items: ['edit_settings', 'manage_tracking'] 
  },
  { 
    id: 'dashboard_widgets', 
    name: '📊 Widget Dashboard', 
    items: ['view_sales_stats', 'view_charts', 'view_top_products', 'view_top_advertisers', 'view_top_cs', 'view_recent_orders'] 
  },
  { 
    id: 'system', 
    name: '🔧 Sistem', 
    items: ['sound_notifications', 'manage_error_logs', 'view_performance'] 
  },
];

const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({ roleName, onClose, onSave }) => {
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        // Try loading from database first
        const { data, error } = await supabase
          .from('settings')
          .select('role_permissions')
          .eq('id', 'rolePermissions')
          .single();

        if (!error && data?.role_permissions?.[roleName]) {
          const saved = data.role_permissions[roleName];
          console.log('✅ Loaded permissions for', roleName, 'from DB:', saved);
          setSelectedMenus(new Set(saved.menus || []));
          setSelectedFeatures(new Set(saved.features || []));
        } else {
          // Fallback to defaults if not found in DB
          const defaults = DEFAULT_ROLE_PERMISSIONS[roleName as keyof typeof DEFAULT_ROLE_PERMISSIONS];
          if (defaults) {
            console.log('📋 Loading default permissions for', roleName);
            setSelectedMenus(new Set(defaults.menus));
            setSelectedFeatures(new Set(defaults.features));
          }
        }
      } catch (err) {
        console.error('Error loading permissions:', err);
        // Fallback to defaults on error
        const defaults = DEFAULT_ROLE_PERMISSIONS[roleName as keyof typeof DEFAULT_ROLE_PERMISSIONS];
        if (defaults) {
          setSelectedMenus(new Set(defaults.menus));
          setSelectedFeatures(new Set(defaults.features));
        }
      }
    };
    loadPermissions();
  }, [roleName]);

  const handleMenuToggle = (menuId: string) => {
    const newMenus = new Set(selectedMenus);
    if (newMenus.has(menuId)) {
      newMenus.delete(menuId);
    } else {
      newMenus.add(menuId);
    }
    setSelectedMenus(newMenus);
  };

  const handleFeatureToggle = (featureId: string) => {
    const newFeatures = new Set(selectedFeatures);
    if (newFeatures.has(featureId)) {
      newFeatures.delete(featureId);
    } else {
      newFeatures.add(featureId);
    }
    setSelectedFeatures(newFeatures);
  };

  const handleSelectAllMenus = () => {
    if (selectedMenus.size === ALL_MENUS.length) {
      setSelectedMenus(new Set());
    } else {
      setSelectedMenus(new Set(ALL_MENUS.map(m => m.id)));
    }
  };

  const handleSelectAllFeatures = () => {
    if (selectedFeatures.size === ALL_FEATURES.length) {
      setSelectedFeatures(new Set());
    } else {
      setSelectedFeatures(new Set(ALL_FEATURES.map(f => f.id)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(roleName, Array.from(selectedMenus), Array.from(selectedFeatures));
    } finally {
      setSaving(false);
    }
  };

  // Helper to toggle all items in a group
  const handleToggleMenuGroup = (groupItems: string[]) => {
    const allSelected = groupItems.every(id => selectedMenus.has(id));
    const newMenus = new Set(selectedMenus);
    if (allSelected) {
      groupItems.forEach(id => newMenus.delete(id));
    } else {
      groupItems.forEach(id => newMenus.add(id));
    }
    setSelectedMenus(newMenus);
  };

  const handleToggleFeatureGroup = (groupItems: string[]) => {
    const allSelected = groupItems.every(id => selectedFeatures.has(id));
    const newFeatures = new Set(selectedFeatures);
    if (allSelected) {
      groupItems.forEach(id => newFeatures.delete(id));
    } else {
      groupItems.forEach(id => newFeatures.add(id));
    }
    setSelectedFeatures(newFeatures);
  };

  // Get menu data by ID
  const getMenuById = (id: string) => ALL_MENUS.find(m => m.id === id);
  const getFeatureById = (id: string) => ALL_FEATURES.find(f => f.id === id);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Kelola Izin Peran: {roleName}</h2>
            <p className="text-indigo-100 text-sm mt-1">Pilih menu dan fitur yang dapat diakses oleh peran ini</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/20 transition">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Quick Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedMenus.size}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Menu Aktif</p>
              </div>
              <div className="w-px h-10 bg-slate-300 dark:bg-slate-600"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedFeatures.size}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Fitur Aktif</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAllMenus}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition"
              >
                {selectedMenus.size === ALL_MENUS.length ? '✕ Hapus Semua Menu' : '✓ Pilih Semua Menu'}
              </button>
              <button
                onClick={handleSelectAllFeatures}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 transition"
              >
                {selectedFeatures.size === ALL_FEATURES.length ? '✕ Hapus Semua Fitur' : '✓ Pilih Semua Fitur'}
              </button>
            </div>
          </div>

          {/* Menus Section - Grouped */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">📋</span>
              Akses Menu
            </h3>
            <div className="space-y-4">
              {MENU_GROUPS.map(group => {
                const validItems = group.items.filter(id => getMenuById(id));
                if (validItems.length === 0) return null;
                const allSelected = validItems.every(id => selectedMenus.has(id));
                const someSelected = validItems.some(id => selectedMenus.has(id));
                
                return (
                  <div key={group.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {/* Group Header */}
                    <div 
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      onClick={() => handleToggleMenuGroup(validItems)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={() => handleToggleMenuGroup(validItems)}
                          onClick={e => e.stopPropagation()}
                          className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800 dark:text-white">{group.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({validItems.filter(id => selectedMenus.has(id)).length}/{validItems.length})
                        </span>
                      </div>
                    </div>
                    {/* Group Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-white dark:bg-slate-800">
                      {validItems.map(menuId => {
                        const menu = getMenuById(menuId);
                        if (!menu) return null;
                        const isSubmenu = menu.category === 'submenu';
                        return (
                          <label 
                            key={menu.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                              selectedMenus.has(menu.id) 
                                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' 
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            } ${isSubmenu ? 'pl-8' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedMenus.has(menu.id)}
                              onChange={() => handleMenuToggle(menu.id)}
                              className="w-4 h-4 rounded border-slate-300 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-slate-900 dark:text-white text-sm ${isSubmenu ? 'text-slate-700 dark:text-slate-300' : ''}`}>
                                {isSubmenu && <span className="text-slate-400 mr-1">└</span>}
                                {menu.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{menu.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Section - Grouped */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">⚙️</span>
              Izin Fitur
            </h3>
            <div className="space-y-4">
              {FEATURE_GROUPS.map(group => {
                const validItems = group.items.filter(id => getFeatureById(id));
                if (validItems.length === 0) return null;
                const allSelected = validItems.every(id => selectedFeatures.has(id));
                const someSelected = validItems.some(id => selectedFeatures.has(id));
                
                return (
                  <div key={group.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {/* Group Header */}
                    <div 
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      onClick={() => handleToggleFeatureGroup(validItems)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={() => handleToggleFeatureGroup(validItems)}
                          onClick={e => e.stopPropagation()}
                          className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800 dark:text-white">{group.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({validItems.filter(id => selectedFeatures.has(id)).length}/{validItems.length})
                        </span>
                      </div>
                    </div>
                    {/* Group Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-white dark:bg-slate-800">
                      {validItems.map(featureId => {
                        const feature = getFeatureById(featureId);
                        if (!feature) return null;
                        return (
                          <label 
                            key={feature.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                              selectedFeatures.has(feature.id) 
                                ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30' 
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFeatures.has(feature.id)}
                              onChange={() => handleFeatureToggle(feature.id)}
                              className="w-4 h-4 rounded border-slate-300 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm">{feature.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{feature.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 Tip: Klik header grup untuk memilih/hapus semua item dalam grup
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/25"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircleFilledIcon className="w-5 h-5" />
                  Simpan Izin
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionManager;
