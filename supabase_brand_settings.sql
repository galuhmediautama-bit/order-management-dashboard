-- Create brand_settings table to store default settings per brand
CREATE TABLE IF NOT EXISTS public.brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brandId UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
    bankAccounts JSONB DEFAULT '[]'::jsonb,
    qrisPayments JSONB DEFAULT '[]'::jsonb,
    warehouses JSONB DEFAULT '[]'::jsonb,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brand_settings_brandId ON public.brand_settings(brandId);

-- Enable RLS (Row Level Security)
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write their brand settings
CREATE POLICY "Allow authenticated users to manage brand settings"
    ON public.brand_settings
    FOR ALL
    USING (
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Add comment to table
COMMENT ON TABLE public.brand_settings IS 'Stores default settings (bank accounts, QRIS, warehouses) for each brand';
COMMENT ON COLUMN public.brand_settings.bankAccounts IS 'Array of BankAccount objects: {id, bankName, accountHolder, accountNumber, isDefault}';
COMMENT ON COLUMN public.brand_settings.qrisPayments IS 'Array of QRISData objects: {id, displayName, qrisCode (image URL), isDefault}';
COMMENT ON COLUMN public.brand_settings.warehouses IS 'Array of Warehouse objects: {id, name, address, phone, email, city, province, postalCode, isDefault}';
