-- Fix RLS policies untuk settings table
-- Run this in Supabase SQL Editor

-- Step 1: Check current policies
SELECT * FROM pg_policies WHERE tablename = 'settings';

-- Step 2: Drop problematic policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.settings;
DROP POLICY IF EXISTS "Allow Super Admin write" ON public.settings;

-- Step 3: Disable RLS temporarily to allow queries (or set permissive policies)
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Step 4: Or enable with permissive policies (safer)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create permissive read policy
CREATE POLICY "Allow all authenticated users to read settings"
ON public.settings
FOR SELECT
TO authenticated
USING (true);

-- Create write policy for admin only
CREATE POLICY "Allow admin to write settings"
ON public.settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND (role = 'Super Admin' OR role = 'Admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND (role = 'Super Admin' OR role = 'Admin')
  )
);

-- Step 5: Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'settings'
ORDER BY policyname;

-- Success
SELECT '✅ Settings table RLS policies updated successfully!' as status;
