-- Simple migration to add productId column to forms table
-- This is a non-destructive migration that won't fail if column already exists

ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS "productId" UUID;

-- Optional: Add foreign key if needed
-- ALTER TABLE forms
-- ADD CONSTRAINT fk_forms_product_id
-- FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL;

-- Check the column was added
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'forms' ORDER BY ordinal_position;
