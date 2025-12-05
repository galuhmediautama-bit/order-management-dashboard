-- Create announcements table for system-wide announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    "displayMode" TEXT NOT NULL DEFAULT 'popup' CHECK ("displayMode" IN ('popup', 'linebar', 'both')),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "createdBy" UUID REFERENCES public.users(id) ON DELETE SET NULL,
    "order" INT NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_announcements_active ON public.announcements("isActive");
CREATE INDEX idx_announcements_dates ON public.announcements("startDate", "endDate");
CREATE INDEX idx_announcements_order ON public.announcements("order");

-- RLS Policies
-- Allow Super Admin and Admin to manage announcements
CREATE POLICY "Super Admin and Admin can manage announcements"
    ON public.announcements
    FOR ALL
    USING (
        (auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role IN ('Super Admin', 'Admin')
        ))
    )
    WITH CHECK (
        (auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role IN ('Super Admin', 'Admin')
        ))
    );

-- Allow everyone to read active announcements
CREATE POLICY "Everyone can read active announcements"
    ON public.announcements
    FOR SELECT
    USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
