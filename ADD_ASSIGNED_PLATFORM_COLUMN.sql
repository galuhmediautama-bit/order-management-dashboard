-- ============================================
-- Add assignedPlatform column to forms table
-- ============================================

-- Add the column
ALTER TABLE public.forms
ADD COLUMN assignedPlatform VARCHAR(50) DEFAULT NULL;

-- Verify column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'forms' AND column_name = 'assignedPlatform';
