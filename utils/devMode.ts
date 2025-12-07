/**
 * Development Mode Utilities
 * Provides helpers for offline/development mode
 */

import { supabase } from '../firebase';

/**
 * Check if running in development mode (no server connection)
 */
export const isDevelopmentMode = import.meta.env.DEV;

/**
 * Check if Supabase is connected (production)
 */
export const isSupabaseConnected = () => {
  // Check if supabase has real credentials
  return !!(supabase && (supabase as any)?.channel);
};

/**
 * Safe wrapper for Supabase queries
 * Falls back gracefully in development mode
 */
export const safeSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T | null = null
): Promise<{ data: T | null; error: any }> => {
  try {
    if (!isSupabaseConnected()) {
      // Development mode - return mock data
      return {
        data: fallbackData,
        error: null,
      };
    }
    return await queryFn();
  } catch (error) {
    console.warn('[Dev Mode] Query failed, using fallback:', error);
    return {
      data: fallbackData,
      error,
    };
  }
};

/**
 * Show development mode banner
 */
export const showDevModeBanner = () => {
  if (isDevelopmentMode && typeof window !== 'undefined') {
    console.log('%c🎯 DEVELOPMENT MODE ACTIVE', 'color: #FFD700; font-size: 16px; font-weight: bold;');
    console.log('%c📝 No server connection during development', 'color: #87CEEB; font-size: 12px;');
    console.log('%c🚀 Changes deploy to server via git push', 'color: #90EE90; font-size: 12px;');
    console.log('%c✅ CPU usage optimized (no real-time sync)', 'color: #90EE90; font-size: 12px;');
  }
};

/**
 * Development mode notification
 */
export const logDevModeInfo = (message: string) => {
  if (isDevelopmentMode) {
    console.log(`%c[DEV] ${message}`, 'color: #FFD700;');
  }
};
