# ⚡ Quick Fix - Missing brandId Column

## Error
```
column brand_settings.brandId does not exist
```

## Solution (2 minutes)

### 1️⃣ Go to Supabase SQL Editor

### 2️⃣ Copy & Run This
```sql
DROP TABLE IF EXISTS public.brand_settings CASCADE;

CREATE TABLE public.brand_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brandId UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
    bankAccounts JSONB DEFAULT '[]'::jsonb,
    qrisPayments JSONB DEFAULT '[]'::jsonb,
    warehouses JSONB DEFAULT '[]'::jsonb,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_brand_settings_brandId ON public.brand_settings(brandId);

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage brand settings"
    ON public.brand_settings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
```

### 3️⃣ Refresh Browser
- Press **F5** to refresh
- Try saving brand settings again
- ✅ Should work!

---

## Verify It Worked

Run this in Supabase SQL Editor:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'brand_settings' 
AND column_name = 'brandId';
```

**Should return:** `brandId`

---

**Done!** 🎉
