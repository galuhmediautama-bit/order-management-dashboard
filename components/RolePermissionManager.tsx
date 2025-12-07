import React, { useState, useEffect } from 'react';
import { ALL_MENUS, ALL_FEATURES, DEFAULT_ROLE_PERMISSIONS } from '../utils/rolePermissions';
import { supabase } from '../firebase';
import XIcon from './icons/XIcon';
import CheckCircleFilledIcon from './icons/CheckCircleFilledIcon';

interface RolePermissionManagerProps {
  roleName: string;
  onClose: () => void;
  onSave: (roleName: string, menuIds: string[], featureIds: string[]) => Promise<void>;
}

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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Kelola Izin Peran: {roleName}</h2>
            <p className="text-indigo-100 text-sm mt-1">Pilih menu dan fitur yang dapat diakses oleh peran ini</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/20">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Menus Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">📋 Menu</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMenus.size === ALL_MENUS.length}
                  onChange={handleSelectAllMenus}
                  className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Pilih Semua Menu</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_MENUS.map(menu => (
                <label key={menu.id} className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={selectedMenus.has(menu.id)}
                    onChange={() => handleMenuToggle(menu.id)}
                    className="w-5 h-5 rounded border-slate-300 cursor-pointer mt-1 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{menu.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{menu.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">⚙️ Fitur</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFeatures.size === ALL_FEATURES.length}
                  onChange={handleSelectAllFeatures}
                  className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Pilih Semua Fitur</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_FEATURES.map(feature => (
                <label key={feature.id} className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.has(feature.id)}
                    onChange={() => handleFeatureToggle(feature.id)}
                    className="w-5 h-5 rounded border-slate-300 cursor-pointer mt-1 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{feature.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feature.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              ✓ Menu yang dipilih: <span className="font-bold">{selectedMenus.size}</span> | 
              ✓ Fitur yang dipilih: <span className="font-bold">{selectedFeatures.size}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircleFilledIcon className="w-4 h-4" />
                Simpan Izin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionManager;
