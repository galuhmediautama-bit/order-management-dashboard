-- ============================================================================
-- CEK DULU SEBELUM HAPUS - JANGAN LANGSUNG EKSEKUSI FIX!
-- ============================================================================
-- Jalankan query-query ini SATU PER SATU untuk verifikasi
-- ============================================================================

-- ============================================================================
-- STEP 1: Lihat semua policies di 3 tabel yang bermasalah
-- ============================================================================
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('announcements', 'brand_settings', 'brand_settings_backup')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 2: Cek apakah policy _all ada dan USING clause-nya benar
-- ============================================================================
-- Pastikan output menunjukkan:
-- - announcements_all EXISTS dengan cmd = ALL
-- - brand_settings_all EXISTS dengan cmd = ALL  
-- - brand_settings_backup_all EXISTS dengan cmd = ALL

SELECT 
    tablename,
    policyname,
    cmd,
    CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_status,
    CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as with_check_status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname IN ('announcements_all', 'brand_settings_all', 'brand_settings_backup_all');

-- ============================================================================
-- STEP 3: Cek policies yang akan dihapus
-- ============================================================================
-- Pastikan ini adalah policy yang REDUNDANT (duplicate dengan _all)

SELECT 
    tablename,
    policyname,
    cmd,
    'AKAN DIHAPUS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname IN ('announcements_select', 'brand_settings_select', 'brand_settings_backup_select');

-- ============================================================================
-- STEP 4: Test akses SEBELUM hapus (opsional - untuk Super Admin)
-- ============================================================================
-- Login sebagai user biasa dan coba:
-- SELECT * FROM announcements LIMIT 1;
-- SELECT * FROM brand_settings LIMIT 1;
-- SELECT * FROM brand_settings_backup LIMIT 1;

-- ============================================================================
-- JIKA SEMUA CEK OK, BARU JALANKAN INI:
-- ============================================================================
-- DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
-- DROP POLICY IF EXISTS "brand_settings_select" ON public.brand_settings;
-- DROP POLICY IF EXISTS "brand_settings_backup_select" ON public.brand_settings_backup;

-- ============================================================================
-- STEP 5: Verifikasi SETELAH hapus
-- ============================================================================
-- Jalankan STEP 1 lagi untuk pastikan hanya _all yang tersisa
-- Lalu test akses lagi (STEP 4)
