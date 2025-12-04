-- Add product_id column to orders table
-- This allows tracking which product is associated with each order

ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);

-- Update existing orders by linking them to products via forms
UPDATE orders
SET product_id = f.product_id
FROM forms f
WHERE orders."formId" = f.id
AND orders.product_id IS NULL
AND f.product_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.product_id IS 'Reference to the product associated with this order. Allows tracking which product generated sales.';
