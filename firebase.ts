
import { createClient } from "@supabase/supabase-js";
import { SupabaseConnectionPool, getPoolConfig } from "./utils/connectionPool";

// KONFIGURASI SUPABASE - Development & Production
// Strategy: Selalu connect ke Supabase real untuk data production

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// ✅ ALWAYS USE REAL SUPABASE - Development & Production
// Localhost akan menggunakan data real dari Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ggxyaautsdukyapstlgr.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4";

// Validasi credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('🚨 ERROR: Supabase credentials tidak ditemukan!');
  console.error('⚠️ Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY');
}

// Environment info
if (isDev) {
  console.log('🎯 DEVELOPMENT MODE: Connected to Supabase (REAL DATA)');
  console.log('📊 Using production database for local testing');
} else {
  console.log('🚀 PRODUCTION MODE: Connected to Supabase');
}

// Create Supabase client - always real connection
export const supabase = createClient(supabaseUrl, supabaseKey, {
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
});

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

