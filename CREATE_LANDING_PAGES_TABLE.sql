-- Create landing_pages table for Sales Page and Product Page
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sales', 'product')),
  
  -- Common fields
  "isPublished" BOOLEAN DEFAULT false,
  "footerText" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  
  -- Sales Page specific fields (stored as JSONB for flexibility)
  "heroImage" TEXT,
  "heroTitle" TEXT,
  "heroSubtitle" TEXT,
  "contentBlocks" JSONB DEFAULT '[]'::jsonb,
  "ctaButtonText" TEXT,
  "ctaFormId" UUID,
  
  -- Product Page specific fields
  "headerImage" TEXT,
  "headerTitle" TEXT,
  "headerSubtitle" TEXT,
  "products" JSONB DEFAULT '[]'::jsonb,
  "gridColumns" INTEGER DEFAULT 3,
  "showPrice" BOOLEAN DEFAULT true,
  "buttonText" TEXT,
  "backgroundColor" TEXT DEFAULT '#f8fafc'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_type ON landing_pages(type);
CREATE INDEX IF NOT EXISTS idx_landing_pages_published ON landing_pages("isPublished");

-- Enable RLS (Row Level Security)
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to published pages
CREATE POLICY "Public can view published landing pages" ON landing_pages
  FOR SELECT
  USING ("isPublished" = true);

-- Policy for authenticated users to manage all landing pages
CREATE POLICY "Authenticated users can manage landing pages" ON landing_pages
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Comment on table
COMMENT ON TABLE landing_pages IS 'Stores landing pages - Sales Page (detailed storytelling) and Product Page (catalog grid)';
