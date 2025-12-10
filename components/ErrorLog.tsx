import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../firebase';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import XIcon from './icons/XIcon';
import RefreshIcon from './icons/RefreshIcon';
import CheckCircleFilledIcon from './icons/CheckCircleFilledIcon';

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  source: 'notification' | 'database' | 'api' | 'auth' | 'system';
  message: string;
  details?: string;
  resolved: boolean;
}

interface ErrorLogProps {
  maxEntries?: number;
  className?: string;
}

const ErrorLog: React.FC<ErrorLogProps> = ({ maxEntries = 10, className = '' }) => {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Test notification system
  const testNotificationSystem = useCallback(async (): Promise<ErrorLogEntry | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          id: `notif-auth-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: 'notification',
          message: 'User tidak terautentikasi untuk notifikasi',
          details: 'Login diperlukan untuk menerima notifikasi',
          resolved: false,
        };
      }

      // Test notification table access
      const { error: notifError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (notifError) {
        return {
          id: `notif-db-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: 'notification',
          message: 'Error akses tabel notifikasi',
          details: notifError.message,
          resolved: false,
        };
      }

      return null; // No error
    } catch (err: any) {
      return {
        id: `notif-catch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'notification',
        message: 'Exception saat test notifikasi',
        details: err?.message || String(err),
        resolved: false,
      };
    }
  }, []);

  // Test database connection
  const testDatabaseConnection = useCallback(async (): Promise<ErrorLogEntry | null> => {
    try {
      const { error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);

      if (ordersError) {
        return {
          id: `db-orders-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: 'database',
          message: 'Error koneksi tabel orders',
          details: ordersError.message,
          resolved: false,
        };
      }

      const { error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (usersError) {
        return {
          id: `db-users-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: 'database',
          message: 'Error koneksi tabel users',
          details: usersError.message,
          resolved: false,
        };
      }

      return null; // No error
    } catch (err: any) {
      return {
        id: `db-catch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'database',
        message: 'Exception saat test database',
        details: err?.message || String(err),
        resolved: false,
      };
    }
  }, []);

  // Test auth status
  const testAuthStatus = useCallback(async (): Promise<ErrorLogEntry | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return {
          id: `auth-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: 'auth',
          message: 'Error mengambil session',
          details: error.message,
          resolved: false,
        };
      }

      if (!session) {
        return {
          id: `auth-nosession-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: 'auth',
          message: 'Session tidak ditemukan',
          details: 'User mungkin perlu login ulang',
          resolved: false,
        };
      }

      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiresDate = new Date(expiresAt * 1000);
        const now = new Date();
        const diffMinutes = (expiresDate.getTime() - now.getTime()) / (1000 * 60);
        
        if (diffMinutes < 5) {
          return {
            id: `auth-expiring-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: 'auth',
            message: 'Session akan segera expired',
            details: `Session expired dalam ${Math.round(diffMinutes)} menit`,
            resolved: false,
          };
        }
      }

      return null; // No error
    } catch (err: any) {
      return {
        id: `auth-catch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'auth',
        message: 'Exception saat test auth',
        details: err?.message || String(err),
        resolved: false,
      };
    }
  }, []);

  // Run all checks
  const runHealthCheck = useCallback(async () => {
    setIsChecking(true);
    const newErrors: ErrorLogEntry[] = [];

    // Run tests in parallel
    const [notifResult, dbResult, authResult] = await Promise.all([
      testNotificationSystem(),
      testDatabaseConnection(),
      testAuthStatus(),
    ]);

    if (notifResult) newErrors.push(notifResult);
    if (dbResult) newErrors.push(dbResult);
    if (authResult) newErrors.push(authResult);

    // Keep only latest entries
    setErrors(prev => {
      const combined = [...newErrors, ...prev.filter(e => e.resolved)];
      return combined.slice(0, maxEntries);
    });

    setIsChecking(false);
  }, [testNotificationSystem, testDatabaseConnection, testAuthStatus, maxEntries]);

  // Initial check on mount
  useEffect(() => {
    runHealthCheck();

    // Periodic check every 2 minutes
    const interval = setInterval(runHealthCheck, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runHealthCheck]);

  // Listen for console errors (optional - captures runtime errors)
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      
      // Capture specific errors
      const errorMsg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (errorMsg.includes('supabase') || errorMsg.includes('notification') || errorMsg.includes('Error')) {
        setErrors(prev => {
          const newEntry: ErrorLogEntry = {
            id: `console-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: 'system',
            message: errorMsg.substring(0, 100),
            details: errorMsg.length > 100 ? errorMsg : undefined,
            resolved: false,
          };
          return [newEntry, ...prev].slice(0, maxEntries);
        });
      }
    };

    return () => {
      console.error = originalError;
    };
  }, [maxEntries]);

  // Dismiss an error
  const dismissError = (id: string) => {
    setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e));
  };

  // Clear all resolved
  const clearResolved = () => {
    setErrors(prev => prev.filter(e => !e.resolved));
  };

  const unresolvedCount = errors.filter(e => !e.resolved).length;
  const hasErrors = unresolvedCount > 0;

  const getSourceIcon = (source: ErrorLogEntry['source']) => {
    switch (source) {
      case 'notification': return '🔔';
      case 'database': return '🗄️';
      case 'api': return '🌐';
      case 'auth': return '🔐';
      case 'system': return '⚙️';
      default: return '❓';
    }
  };

  const getSourceColor = (source: ErrorLogEntry['source']) => {
    switch (source) {
      case 'notification': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'database': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'api': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'auth': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'system': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
          hasErrors 
            ? 'bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30' 
            : 'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {hasErrors ? (
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
              <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <CheckCircleFilledIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          )}
          <div>
            <h3 className={`font-semibold text-sm ${hasErrors ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
              Error Log
            </h3>
            <p className={`text-xs ${hasErrors ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`}>
              {hasErrors ? `${unresolvedCount} error aktif` : 'Semua sistem normal'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              runHealthCheck();
            }}
            disabled={isChecking}
            className={`p-1.5 rounded-lg transition-colors ${
              isChecking 
                ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' 
                : 'hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            title="Refresh health check"
          >
            <RefreshIcon className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            hasErrors 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' 
              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
          }`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Error List (Collapsible) */}
      {isExpanded && (
        <div className="p-4">
          {errors.filter(e => !e.resolved).length === 0 ? (
            <div className="text-center py-6">
              <CheckCircleFilledIcon className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Tidak ada error aktif</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Terakhir dicek: {new Date().toLocaleTimeString('id-ID')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errors.filter(e => !e.resolved).map((error) => (
                <div
                  key={error.id}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30"
                >
                  <span className="text-lg flex-shrink-0">{getSourceIcon(error.source)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSourceColor(error.source)}`}>
                        {error.source}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(error.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {error.message}
                    </p>
                    {error.details && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {error.details}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dismissError(error.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
                    title="Dismiss error"
                  >
                    <XIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Resolved errors section */}
          {errors.filter(e => e.resolved).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Error yang sudah di-dismiss ({errors.filter(e => e.resolved).length})
                </span>
                <button
                  onClick={clearResolved}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Hapus semua
                </button>
              </div>
              <div className="space-y-1">
                {errors.filter(e => e.resolved).slice(0, 3).map((error) => (
                  <div
                    key={error.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-500 dark:text-slate-400"
                  >
                    <span>{getSourceIcon(error.source)}</span>
                    <span className="truncate flex-1">{error.message}</span>
                    <CheckCircleFilledIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorLog;
