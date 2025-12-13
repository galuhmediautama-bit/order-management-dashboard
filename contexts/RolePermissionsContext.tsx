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
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      if (data?.role_permissions) {
        // Merge database permissions with defaults
        const merged = {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...data.role_permissions
        };
        setRolePermissions(merged as RolePermissionMap);
      } else {
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

  // Listen for manual refresh events from permission manager
  useEffect(() => {
    const handleRefresh = () => {
      loadPermissions();
    };
    window.addEventListener('rolePermissionsUpdated', handleRefresh);
    return () => window.removeEventListener('rolePermissionsUpdated', handleRefresh);
  }, [loadPermissions]);

  // Optional: Refresh permissions periodically (e.g., every 5 minutes)
  useEffect(() => {
    const interval = setInterval(loadPermissions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPermissions]);

  const canAccessMenu = useCallback((menuId: string, userRole: string): boolean => {
    // Normalize user role for consistency
    const normalizedRole = userRole.trim();

    const permissions = rolePermissions[normalizedRole as keyof RolePermissionMap];
    if (!permissions) {
      // Only warn once in dev mode
      if (import.meta.env.DEV) {
        console.warn(`⚠️ No permissions found for role: "${normalizedRole}"`);
      }
      return false;
    }
    return permissions.menus.includes(menuId);
  }, [rolePermissions]);

  const canUseFeature = useCallback((featureId: string, userRole: string): boolean => {
    // Normalize user role for consistency
    const normalizedRole = userRole.trim();

    const permissions = rolePermissions[normalizedRole as keyof RolePermissionMap];
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
