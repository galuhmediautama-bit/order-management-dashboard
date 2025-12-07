
import { createClient } from "@supabase/supabase-js";
import { SupabaseConnectionPool, getPoolConfig } from "./utils/connectionPool";

// KONFIGURASI SUPABASE - Development vs Production
// PENTING: Untuk production, HARUS menggunakan environment variables!

// Strategy:
// 1. DEVELOPMENT (localhost): Use mock/offline mode (no server connection)
// 2. PRODUCTION (DigitalOcean): Use real Supabase credentials from env vars + connection pooling

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// ✅ DEVELOPMENT: Disabled - tidak connect ke server
// Edit di komputer bebas tanpa overhead server connection
const supabaseUrl = isDev
  ? "" // Empty in development - no server connection
  : import.meta.env.VITE_SUPABASE_URL || "https://ggxyaautsdukyapstlgr.supabase.co";

const supabaseKey = isDev
  ? "" // Empty in development - no server connection
  : import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4";

// Validasi credentials hanya di production
if (isProd && (!supabaseUrl || !supabaseKey)) {
  console.error('🚨 PRODUCTION ERROR: Supabase credentials tidak ditemukan!');
  console.error('⚠️ Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di deployment platform');
}

// Development mode info
if (isDev) {
  console.log('🎯 DEVELOPMENT MODE: Supabase connection DISABLED');
  console.log('📝 No server connection during local development');
  console.log('🚀 Changes deploy to server via git push only');
}

// Create Supabase client dengan offline fallback
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      // Optimize real-time connections
      params: {
        eventsPerSecond: 10, // Throttle events to max 10/second per client
      },
    },
    global: {
      headers: {
        'x-client-info': 'order-management-dashboard',
      },
    },
  })
  : {
    // Offline mock client for development
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => ({
      select: () => ({ single: async () => ({ data: null, error: null }), async: () => ({ data: null, error: null }) }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => { } }),
      subscribe: () => { },
      unsubscribe: async () => { },
    }),
    removeChannel: async () => { },
  } as any;

// ✅ CONNECTION POOLING
// Initialize connection pool for production
let supabasePool: SupabaseConnectionPool | null = null;

export const getSupabasePool = (): SupabaseConnectionPool | null => {
  if (!supabase || !supabase.from) return null;
  
  if (!supabasePool && isProd) {
    supabasePool = new SupabaseConnectionPool(supabase, getPoolConfig());
    console.log('🔄 Connection pool initialized for production');
  }
  
  return supabasePool;
};

export const closeSupabasePool = (): void => {
  if (supabasePool) {
    supabasePool.close();
    supabasePool = null;
    console.log('🔄 Connection pool closed');
  }
};

// Log pool status in production
if (isProd) {
  setInterval(() => {
    const pool = getSupabasePool();
    if (pool) {
      console.log(pool.getPoolStatus());
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

