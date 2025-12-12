-- Add High-Converting Features to Landing Pages
-- Run this SQL in Supabase SQL Editor

-- Add columns for social proof settings
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "socialProof" JSONB DEFAULT '{
    "active": true,
    "liveViewersMin": 15,
    "liveViewersMax": 45,
    "recentPurchaseNames": "Rina Setyawati\nAndi Prasetyo\nSiti Marlina",
    "recentPurchaseCities": "Jakarta\nBandung\nSurabaya"
}'::jsonb;

-- Add columns for urgency settings
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "urgency" JSONB DEFAULT '{
    "countdownActive": true,
    "countdownMinutes": 15,
    "stockActive": true,
    "stockInitial": 47,
    "stockMin": 5
}'::jsonb;

-- Add columns for reviews
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "reviews" JSONB DEFAULT '[]'::jsonb;

ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "showReviews" BOOLEAN DEFAULT true;

-- Add columns for total sold and CTA subtext
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "totalSold" INTEGER DEFAULT 0;

ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS "ctaSubtext" TEXT DEFAULT 'Stok terbatas! Pesan sebelum kehabisan';

-- Comment for documentation
COMMENT ON COLUMN landing_pages."socialProof" IS 'Social proof settings: live viewers, recent purchase popups';
COMMENT ON COLUMN landing_pages."urgency" IS 'Urgency settings: countdown timer, stock countdown';
COMMENT ON COLUMN landing_pages."reviews" IS 'Customer reviews array with ratings';
COMMENT ON COLUMN landing_pages."showReviews" IS 'Toggle review section visibility';
COMMENT ON COLUMN landing_pages."totalSold" IS 'Total units sold display';
COMMENT ON COLUMN landing_pages."ctaSubtext" IS 'Text below CTA button';
