import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../firebase';
import { DEFAULT_ROLE_PERMISSIONS, type RolePermissionMap } from '../utils/rolePermissions';

interface RolePermissionsContextType {
  rolePermissions: RolePermissionMap;
  loading: boolean;
  error: string | null;
  canAccessMenu: (menuId: string, userRole: string) => boolean;
  canUseFeature: (featureId: string, userRole: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const RolePermissionsContext = createContext<RolePermissionsContextType | undefined>(undefined);

export const RolePermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMap>(DEFAULT_ROLE_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load permissions from database on mount
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('settings')
        .select('role_permissions')
        .eq('id', 'rolePermissions')
        .single();

      if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = not found
        throw dbError;
      }

      if (data?.role_permissions) {
        // Merge database permissions with defaults
        const merged = {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...data.role_permissions
        };
        console.log('📋 Role Permissions - Loaded from DB and merged with defaults:', Object.keys(merged));
        setRolePermissions(merged as RolePermissionMap);
      } else {
        console.log('📋 Role Permissions - Using defaults only (no DB data):', Object.keys(DEFAULT_ROLE_PERMISSIONS));
        setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
      }
    } catch (err) {
      console.error('Error loading role permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback to defaults
      setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Optional: Refresh permissions periodically (e.g., every 5 minutes)
  useEffect(() => {
    const interval = setInterval(loadPermissions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPermissions]);

  const canAccessMenu = useCallback((menuId: string, userRole: string): boolean => {
    const permissions = rolePermissions[userRole as keyof RolePermissionMap];
    if (!permissions) {
      console.warn(`⚠️ No permissions found for role: "${userRole}"`, {
        availableRoles: Object.keys(rolePermissions),
        menuId
      });
      return false;
    }
    const hasAccess = permissions.menus.includes(menuId);
    if (userRole === 'Customer service') {
      console.log(`🔍 canAccessMenu("${menuId}", "${userRole}"):`, hasAccess, {
        allowedMenus: permissions.menus
      });
    }
    return hasAccess;
  }, [rolePermissions]);

  const canUseFeature = useCallback((featureId: string, userRole: string): boolean => {
    const permissions = rolePermissions[userRole as keyof RolePermissionMap];
    if (!permissions) {
      return false;
    }
    return permissions.features.includes(featureId);
  }, [rolePermissions]);

  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  return (
    <RolePermissionsContext.Provider
      value={{
        rolePermissions,
        loading,
        error,
        canAccessMenu,
        canUseFeature,
        refreshPermissions
      }}
    >
      {children}
    </RolePermissionsContext.Provider>
  );
};

export const useRolePermissions = (): RolePermissionsContextType => {
  const context = useContext(RolePermissionsContext);
  if (context === undefined) {
    throw new Error('useRolePermissions must be used within a RolePermissionsProvider');
  }
  return context;
};
