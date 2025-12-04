-- Add missing columns to forms table
-- Migration for productId and assignedAdvertiserId

-- Step 1: Add productId column if not exists
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS "productId" UUID;

-- Step 2: Add assignedAdvertiserId column if not exists
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS "assignedAdvertiserId" UUID;

-- Step 3: Add foreign key constraints (ignore if already exists)
-- Note: Using DO block to conditionally add constraints only if they don't exist
DO $$ 
BEGIN
    -- Try to add productId constraint
    BEGIN
        ALTER TABLE forms
        ADD CONSTRAINT fk_forms_product_id
        FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    -- Try to add assignedAdvertiserId constraint
    BEGIN
        ALTER TABLE forms
        ADD CONSTRAINT fk_forms_assigned_advertiser
        FOREIGN KEY ("assignedAdvertiserId") REFERENCES users(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Step 4: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_forms_product_id ON forms("productId");
CREATE INDEX IF NOT EXISTS idx_forms_assigned_advertiser_id ON forms("assignedAdvertiserId");

-- Verify the changes
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'forms';
