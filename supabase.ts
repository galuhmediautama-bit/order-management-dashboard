
import { createClient } from "@supabase/supabase-js";

// KONFIGURASI SUPABASE
// PENTING: Untuk production, HARUS menggunakan environment variables!
// Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local atau deployment platform

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ggxyaautsdukyapstlgr.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4";

// Validasi bahwa credentials tersedia
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ SECURITY WARNING: Supabase credentials tidak ditemukan!');
  console.error('📝 Copy .env.example ke .env.local dan isi dengan credentials Anda');
  console.error('🔒 Lihat SECURITY.md untuk panduan lengkap');
}

// WARNING: Fallback credentials di atas HANYA untuk development
// Untuk production, WAJIB set environment variables di deployment platform
if (import.meta.env.PROD && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.error('🚨 PRODUCTION ERROR: Environment variables belum di-set!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
