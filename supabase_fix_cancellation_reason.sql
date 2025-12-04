-- Fix cancellation reason system
-- Run this SQL in Supabase SQL Editor

-- Step 1: Check if column exists, if not create it
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT DEFAULT NULL;

-- Step 2: Add comment
COMMENT ON COLUMN orders."cancellationReason" IS 'Reason why the order was canceled';

-- Step 3: Verify settings table has cancellation reasons
INSERT INTO settings (id, reasons)
VALUES (
  'cancellationReasons',
  ARRAY[
    'Pelanggan tidak merespons',
    'Pelanggan membatalkan sendiri',
    'Alamat tidak lengkap/salah',
    'Nomor telepon tidak aktif',
    'Produk tidak tersedia',
    'Harga tidak sesuai',
    'Pembayaran gagal',
    'Duplikat pesanan',
    'Lainnya'
  ]::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
reasons = EXCLUDED.reasons;

-- Step 4: Verify column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'cancellationReason';

-- Step 5: Check settings has cancellation reasons
SELECT id, reasons FROM settings WHERE id = 'cancellationReasons';

-- Step 6: Check if there are any RLS policies that might block updates
SELECT * FROM pg_policies WHERE tablename = 'orders';
