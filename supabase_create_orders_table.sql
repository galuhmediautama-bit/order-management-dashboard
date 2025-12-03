-- Create or verify orders table structure
-- Run this in Supabase SQL Editor

-- First, check if orders table exists
DO $$ 
BEGIN
    -- Create orders table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        CREATE TABLE orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer TEXT NOT NULL,
            "customerPhone" TEXT NOT NULL,
            "customerEmail" TEXT DEFAULT '',
            "shippingAddress" TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Pending',
            urgency TEXT NOT NULL DEFAULT 'Low',
            "followUps" INTEGER DEFAULT 0,
            date TIMESTAMPTZ NOT NULL DEFAULT now(),
            "productName" TEXT NOT NULL,
            "productPrice" NUMERIC NOT NULL DEFAULT 0,
            "shippingResi" TEXT,
            "formId" UUID,
            "formTitle" TEXT,
            "brandId" UUID,
            "shippingMethod" TEXT,
            "paymentMethod" TEXT,
            "totalPrice" NUMERIC DEFAULT 0,
            "assignedCsId" UUID,
            "commissionSnapshot" NUMERIC DEFAULT 0,
            "csCommission" NUMERIC DEFAULT 0,
            "advCommission" NUMERIC DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        -- Add indexes
        CREATE INDEX idx_orders_date ON orders(date DESC);
        CREATE INDEX idx_orders_status ON orders(status);
        CREATE INDEX idx_orders_assignedCsId ON orders("assignedCsId");
        CREATE INDEX idx_orders_formId ON orders("formId");
        CREATE INDEX idx_orders_brandId ON orders("brandId");
        
        RAISE NOTICE 'Orders table created successfully';
    ELSE
        RAISE NOTICE 'Orders table already exists';
    END IF;
END $$;

-- Now add any missing columns to existing table
DO $$ 
BEGIN
    -- Add customer column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer') THEN
        ALTER TABLE orders ADD COLUMN customer TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add customerPhone column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customerPhone') THEN
        ALTER TABLE orders ADD COLUMN "customerPhone" TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add customerEmail column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customerEmail') THEN
        ALTER TABLE orders ADD COLUMN "customerEmail" TEXT DEFAULT '';
    END IF;
    
    -- Add shippingAddress column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingAddress') THEN
        ALTER TABLE orders ADD COLUMN "shippingAddress" TEXT DEFAULT '';
    END IF;
    
    -- Add productName column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'productName') THEN
        ALTER TABLE orders ADD COLUMN "productName" TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Add productPrice column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'productPrice') THEN
        ALTER TABLE orders ADD COLUMN "productPrice" NUMERIC DEFAULT 0;
    END IF;
    
    -- Add shippingMethod column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingMethod') THEN
        ALTER TABLE orders ADD COLUMN "shippingMethod" TEXT;
    END IF;
    
    -- Add paymentMethod column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentMethod') THEN
        ALTER TABLE orders ADD COLUMN "paymentMethod" TEXT;
    END IF;
    
    -- Add totalPrice column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'totalPrice') THEN
        ALTER TABLE orders ADD COLUMN "totalPrice" NUMERIC DEFAULT 0;
    END IF;
    
    -- Add formId column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'formId') THEN
        ALTER TABLE orders ADD COLUMN "formId" UUID;
    END IF;
    
    -- Add formTitle column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'formTitle') THEN
        ALTER TABLE orders ADD COLUMN "formTitle" TEXT;
    END IF;
    
    -- Add brandId column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'brandId') THEN
        ALTER TABLE orders ADD COLUMN "brandId" UUID;
    END IF;
    
    -- Add assignedCsId column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assignedCsId') THEN
        ALTER TABLE orders ADD COLUMN "assignedCsId" UUID;
    END IF;
    
    -- Add commissionSnapshot column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commissionSnapshot') THEN
        ALTER TABLE orders ADD COLUMN "commissionSnapshot" NUMERIC DEFAULT 0;
    END IF;
    
    -- Add csCommission column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'csCommission') THEN
        ALTER TABLE orders ADD COLUMN "csCommission" NUMERIC DEFAULT 0;
    END IF;
    
    -- Add advCommission column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'advCommission') THEN
        ALTER TABLE orders ADD COLUMN "advCommission" NUMERIC DEFAULT 0;
    END IF;
    
    -- Add shippingResi column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingResi') THEN
        ALTER TABLE orders ADD COLUMN "shippingResi" TEXT;
    END IF;
    
    -- Add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending';
    END IF;
    
    -- Add urgency column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'urgency') THEN
        ALTER TABLE orders ADD COLUMN urgency TEXT NOT NULL DEFAULT 'Low';
    END IF;
    
    -- Add followUps column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'followUps') THEN
        ALTER TABLE orders ADD COLUMN "followUps" INTEGER DEFAULT 0;
    END IF;
    
    -- Add date column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'date') THEN
        ALTER TABLE orders ADD COLUMN date TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
