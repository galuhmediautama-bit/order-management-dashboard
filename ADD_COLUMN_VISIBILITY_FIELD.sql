-- Add columnVisibility field to users table for storing column preferences per user
-- This field stores a JSON object with column keys as keys and boolean visibility values

ALTER TABLE users
ADD COLUMN IF NOT EXISTS "columnVisibility" jsonb DEFAULT '{
  "orderId": true,
  "customer": true,
  "product": true,
  "status": true,
  "platform": true,
  "cs": true,
  "followUp": true,
  "actions": true
}'::jsonb;

-- Add index for faster queries if needed
CREATE INDEX IF NOT EXISTS idx_users_columnVisibility 
ON users USING gin ("columnVisibility");

-- Optional: Add comment to document the field
COMMENT ON COLUMN users."columnVisibility" IS 
'JSON object storing column visibility preferences for orders table. Format: {"columnKey": boolean, ...}';
