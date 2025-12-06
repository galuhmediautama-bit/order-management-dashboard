-- Create settings table for storing role permissions and other configs
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    role_permissions JSONB,
    website_settings JSONB,
    tracking_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings (needed for role permissions)
CREATE POLICY "Allow all authenticated users to read settings" ON public.settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only Super Admin can modify settings
CREATE POLICY "Only Super Admin can modify settings" ON public.settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'Super Admin'
    )
);

-- Insert default rolePermissions entry (optional - app will use defaults if not found)
-- This is just a placeholder, the app will use DEFAULT_ROLE_PERMISSIONS from code
INSERT INTO public.settings (id, role_permissions)
VALUES ('rolePermissions', NULL)
ON CONFLICT (id) DO NOTHING;

-- Verify table created
SELECT * FROM public.settings;
