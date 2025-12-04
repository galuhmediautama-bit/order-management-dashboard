-- Add soft delete columns to orders table
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    -- Add deletedAt column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deletedAt') THEN
        ALTER TABLE orders ADD COLUMN "deletedAt" TIMESTAMPTZ;
        CREATE INDEX idx_orders_deletedAt ON orders("deletedAt");
        RAISE NOTICE 'deletedAt column added successfully';
    ELSE
        RAISE NOTICE 'deletedAt column already exists';
    END IF;
    
    -- Add scheduledDeletionDate column if missing (for 7-day auto-delete)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'scheduledDeletionDate') THEN
        ALTER TABLE orders ADD COLUMN "scheduledDeletionDate" TIMESTAMPTZ;
        CREATE INDEX idx_orders_scheduledDeletionDate ON orders("scheduledDeletionDate");
        RAISE NOTICE 'scheduledDeletionDate column added successfully';
    ELSE
        RAISE NOTICE 'scheduledDeletionDate column already exists';
    END IF;
END $$;

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name IN ('deletedAt', 'scheduledDeletionDate')
ORDER BY column_name;
