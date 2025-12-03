-- Add ALL missing columns to orders table
-- Run this in Supabase SQL Editor
-- This is a comprehensive fix for all missing columns

DO $$ 
BEGIN
    -- First, ensure id column has default UUID generation
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'id') THEN
        -- Check if id already has a default, if not add it
        BEGIN
            ALTER TABLE orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
            RAISE NOTICE 'Set default UUID generator for id column';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'ID column already has default or error: %', SQLERRM;
        END;
    END IF;
    
    -- Basic customer info columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer') THEN
        ALTER TABLE orders ADD COLUMN customer TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added customer column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customerPhone') THEN
        ALTER TABLE orders ADD COLUMN "customerPhone" TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added customerPhone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customerEmail') THEN
        ALTER TABLE orders ADD COLUMN "customerEmail" TEXT DEFAULT '';
        RAISE NOTICE 'Added customerEmail column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingAddress') THEN
        ALTER TABLE orders ADD COLUMN "shippingAddress" TEXT DEFAULT '';
        RAISE NOTICE 'Added shippingAddress column';
    END IF;
    
    -- Product info columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'productName') THEN
        ALTER TABLE orders ADD COLUMN "productName" TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added productName column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'productPrice') THEN
        ALTER TABLE orders ADD COLUMN "productPrice" NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added productPrice column';
    END IF;
    
    -- Payment & shipping columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingMethod') THEN
        ALTER TABLE orders ADD COLUMN "shippingMethod" TEXT;
        RAISE NOTICE 'Added shippingMethod column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentMethod') THEN
        ALTER TABLE orders ADD COLUMN "paymentMethod" TEXT;
        RAISE NOTICE 'Added paymentMethod column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'totalPrice') THEN
        ALTER TABLE orders ADD COLUMN "totalPrice" NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added totalPrice column';
    END IF;
    
    -- Form & brand reference columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'formId') THEN
        ALTER TABLE orders ADD COLUMN "formId" UUID;
        RAISE NOTICE 'Added formId column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'formTitle') THEN
        ALTER TABLE orders ADD COLUMN "formTitle" TEXT;
        RAISE NOTICE 'Added formTitle column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'brandId') THEN
        ALTER TABLE orders ADD COLUMN "brandId" UUID;
        RAISE NOTICE 'Added brandId column';
    END IF;
    
    -- CS assignment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assignedCsId') THEN
        ALTER TABLE orders ADD COLUMN "assignedCsId" UUID;
        RAISE NOTICE 'Added assignedCsId column';
    END IF;
    
    -- Commission columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commissionSnapshot') THEN
        ALTER TABLE orders ADD COLUMN "commissionSnapshot" NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added commissionSnapshot column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'csCommission') THEN
        ALTER TABLE orders ADD COLUMN "csCommission" NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added csCommission column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'advCommission') THEN
        ALTER TABLE orders ADD COLUMN "advCommission" NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added advCommission column';
    END IF;
    
    -- Shipping tracking column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingResi') THEN
        ALTER TABLE orders ADD COLUMN "shippingResi" TEXT;
        RAISE NOTICE 'Added shippingResi column';
    END IF;
    
    -- Status and urgency columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending';
        RAISE NOTICE 'Added status column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'urgency') THEN
        ALTER TABLE orders ADD COLUMN urgency TEXT NOT NULL DEFAULT 'Low';
        RAISE NOTICE 'Added urgency column';
    END IF;
    
    -- Follow-ups counter column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'followUps') THEN
        ALTER TABLE orders ADD COLUMN "followUps" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added followUps column';
    END IF;
    
    -- Date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'date') THEN
        ALTER TABLE orders ADD COLUMN date TIMESTAMPTZ NOT NULL DEFAULT now();
        RAISE NOTICE 'Added date column';
    END IF;
END $$;

-- Verify all columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
