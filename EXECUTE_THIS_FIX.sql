-- ============================================================
-- COMPLETE FIX for: column brand_settings.brandId does not exist
-- ============================================================
-- Copy ALL of this and run in Supabase SQL Editor
-- ============================================================

-- 1. DROP AND RECREATE TABLE
DROP TABLE IF EXISTS public.brand_settings CASCADE;

CREATE TABLE public.brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brandId UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
    bankAccounts JSONB DEFAULT '[]'::jsonb,
    qrisPayments JSONB DEFAULT '[]'::jsonb,
    warehouses JSONB DEFAULT '[]'::jsonb,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_brand_settings_brandId ON public.brand_settings(brandId);
CREATE INDEX idx_brand_settings_createdAt ON public.brand_settings(createdAt);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICY
CREATE POLICY "Allow authenticated users to manage brand settings"
    ON public.brand_settings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 5. ADD COMMENTS (FOR DOCUMENTATION)
COMMENT ON TABLE public.brand_settings IS 'Stores default settings (bank accounts, QRIS, warehouses) for each brand';
COMMENT ON COLUMN public.brand_settings.id IS 'Unique identifier';
COMMENT ON COLUMN public.brand_settings.brandId IS 'Foreign key to brands table - THIS IS THE MISSING COLUMN!';
COMMENT ON COLUMN public.brand_settings.bankAccounts IS 'JSON array of BankAccount objects';
COMMENT ON COLUMN public.brand_settings.qrisPayments IS 'JSON array of QRISData objects';
COMMENT ON COLUMN public.brand_settings.warehouses IS 'JSON array of Warehouse objects';

-- 6. VERIFICATION - RUN THESE TO CONFIRM THE FIX
SELECT '=== VERIFICATION RESULTS ===' as verification;
SELECT 'Table exists?' as check_1, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_settings') as result;
SELECT 'brandId column exists?' as check_2, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_settings' AND column_name = 'brandId') as result;
SELECT 'All required columns?' as check_3, 
    CASE WHEN COUNT(*) = 7 THEN 'YES - 7 columns found' ELSE 'NO - only ' || COUNT(*) || ' columns found' END as result
FROM information_schema.columns WHERE table_name = 'brand_settings';

-- 7. LIST ALL COLUMNS (FOR YOUR REFERENCE)
SELECT 'Column name' as column_name, 'Data type' as data_type UNION ALL
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'brand_settings' ORDER BY ordinal_position;

-- ============================================================
-- DONE! The table is now fixed.
-- Next: Refresh your browser and try saving Brand Settings
-- ============================================================
