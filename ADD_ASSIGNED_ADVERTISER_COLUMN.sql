-- Add assignedAdvertiserId column to orders table
-- Run this in Supabase SQL Editor

-- Add the column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "assignedAdvertiserId" UUID REFERENCES users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_assigned_advertiser 
ON orders("assignedAdvertiserId");

-- Verify column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'assignedAdvertiserId';
