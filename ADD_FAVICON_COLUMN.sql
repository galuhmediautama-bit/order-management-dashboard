-- ============================================
-- ADD FAVICON COLUMN TO SETTINGS TABLE
-- Run this script in Supabase SQL Editor
-- ============================================

-- Add favicon column to settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'favicon'
    ) THEN
        ALTER TABLE public.settings ADD COLUMN favicon TEXT;
        RAISE NOTICE 'Column favicon added successfully';
    ELSE
        RAISE NOTICE 'Column favicon already exists';
    END IF;
END $$;

-- Also ensure other website settings columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'siteName'
    ) THEN
        ALTER TABLE public.settings ADD COLUMN "siteName" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'siteDescription'
    ) THEN
        ALTER TABLE public.settings ADD COLUMN "siteDescription" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'logo'
    ) THEN
        ALTER TABLE public.settings ADD COLUMN logo TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'supportEmail'
    ) THEN
        ALTER TABLE public.settings ADD COLUMN "supportEmail" TEXT;
    END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'settings'
ORDER BY ordinal_position;
