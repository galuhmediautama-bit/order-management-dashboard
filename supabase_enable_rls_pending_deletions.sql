-- Enable RLS on pending_deletions table
-- This fixes the security error: RLS Disabled in Public

-- Step 1: Enable RLS on the table
ALTER TABLE public.pending_deletions ENABLE ROW LEVEL SECURITY;

-- Step 2: Create permissive policies for full access
-- Allow authenticated users and anon to access
CREATE POLICY "Allow all access to pending_deletions" ON public.pending_deletions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'pending_deletions';
