-- ============================================================================
-- FIX brand_settings_backup - ADD PRIMARY KEY
-- ============================================================================
-- Table already has 'id' column (uuid), just need to make it primary key
-- ============================================================================

-- Add primary key constraint to existing id column
ALTER TABLE public.brand_settings_backup 
    ADD CONSTRAINT brand_settings_backup_pkey PRIMARY KEY (id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify primary key was added:
-- 
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'brand_settings_backup';
