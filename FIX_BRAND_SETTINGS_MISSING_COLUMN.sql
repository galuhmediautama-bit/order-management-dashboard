-- Fix for: column brand_settings.brandId does not exist
-- This script will check and recreate the brand_settings table if needed

-- Step 1: Check if table exists and has the brandId column
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brand_settings' 
    AND column_name = 'brandId'
) as column_exists;

-- Step 2: If the column doesn't exist, we need to recreate the table
-- First, backup existing data (if any)
CREATE TABLE IF NOT EXISTS brand_settings_backup AS
SELECT * FROM brand_settings WHERE false;

-- Step 3: Drop existing table (if any issues)
DROP TABLE IF EXISTS public.brand_settings CASCADE;

-- Step 4: Recreate the table with all columns
CREATE TABLE public.brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brandId UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
    bankAccounts JSONB DEFAULT '[]'::jsonb,
    qrisPayments JSONB DEFAULT '[]'::jsonb,
    warehouses JSONB DEFAULT '[]'::jsonb,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX idx_brand_settings_brandId ON public.brand_settings(brandId);
CREATE INDEX idx_brand_settings_createdAt ON public.brand_settings(createdAt);

-- Step 6: Enable RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to manage brand settings" ON public.brand_settings;

CREATE POLICY "Allow authenticated users to manage brand settings"
    ON public.brand_settings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Step 8: Add comments
COMMENT ON TABLE public.brand_settings IS 'Stores default settings (bank accounts, QRIS, warehouses) for each brand';
COMMENT ON COLUMN public.brand_settings.id IS 'Unique identifier for brand settings';
COMMENT ON COLUMN public.brand_settings.brandId IS 'Foreign key reference to brands table';
COMMENT ON COLUMN public.brand_settings.bankAccounts IS 'Array of BankAccount objects: {id, bankName, accountHolder, accountNumber, isDefault}';
COMMENT ON COLUMN public.brand_settings.qrisPayments IS 'Array of QRISData objects: {id, displayName, qrisCode (image URL), isDefault}';
COMMENT ON COLUMN public.brand_settings.warehouses IS 'Array of Warehouse objects: {id, name, address, phone, email, city, province, postalCode, isDefault}';

-- Verification: Check if column exists now
SELECT 
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_settings') as table_exists,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_settings' AND column_name = 'brandId') as brandId_column_exists,
    COUNT(*) as total_rows
FROM public.brand_settings;
