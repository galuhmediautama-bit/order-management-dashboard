-- Add cancellation_reason column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

-- Add comment
COMMENT ON COLUMN orders."cancellationReason" IS 'Reason why the order was canceled';

-- Step 1: Add reasons column to settings table if it doesn't exist
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS reasons TEXT[] DEFAULT NULL;

-- Step 2: Create or update cancellation_reasons settings entry
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

-- Verify
SELECT id, reasons FROM settings WHERE id = 'cancellationReasons';
