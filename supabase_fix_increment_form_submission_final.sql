-- Fix: increment_form_submission with proper search_path
-- This function tracks form submission counts

DROP FUNCTION IF EXISTS public.increment_form_submission(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.increment_form_submission(form_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Increment form submission counter
  UPDATE public.forms 
  SET submission_count = COALESCE(submission_count, 0) + 1,
      updated_at = NOW()
  WHERE id = form_id;
  
  -- If forms table doesn't have submission_count, just update updated_at
  -- UPDATE public.forms 
  -- SET updated_at = NOW()
  -- WHERE id = form_id;
END;
$$;

-- Test query to verify function works
-- SELECT public.increment_form_submission('YOUR_FORM_UUID_HERE');

-- Verify the function definition
-- SELECT pg_get_functiondef(oid) 
-- FROM pg_proc 
-- WHERE proname = 'increment_form_submission' 
-- AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
