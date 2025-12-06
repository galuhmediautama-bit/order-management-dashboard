-- DIAGNOSTIC: Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'brand_settings'
ORDER BY ordinal_position;

-- Check if brandId column exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'brand_settings' 
    AND column_name = 'brandId'
) AS "brandId_exists";

-- Check what columns DO exist
SELECT STRING_AGG(column_name, ', ') as existing_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brand_settings';
