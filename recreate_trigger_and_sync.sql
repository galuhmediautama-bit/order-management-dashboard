-- FIRST: Check actual table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if handle_new_user trigger exists and works
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users';

-- If trigger doesn't exist or isn't working, let's create it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'galuhmediautama@gmail.com' THEN 'Super Admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'Advertiser')
    END,
    'Aktif',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = NEW.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create or replace trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test: Insert a test user ke public.users manually
INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
VALUES ('test-id-123', 'test@example.com', 'Test User', 'Advertiser', 'Aktif', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Show all users
SELECT id, email, name, role, status FROM public.users;
