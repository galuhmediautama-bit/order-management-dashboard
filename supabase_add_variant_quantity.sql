-- Add variant and quantity columns to orders table

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS variant TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_variant ON orders(variant);

-- Update existing orders to have default quantity = 1
UPDATE orders SET quantity = 1 WHERE quantity IS NULL;
