-- ============================================================================
-- DELETE AUTH USER RPC FUNCTION
-- ============================================================================
-- This RPC function allows deleting a user from auth.users table
-- Must be run by a user with admin/super_admin_auth_user role in Supabase
--
-- Usage: 
--   SELECT delete_auth_user('user-id-here');
--
-- Or from JavaScript:
--   const { error } = await supabase.rpc('delete_auth_user', { user_id: 'user-id' });
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_auth_user(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_user_email TEXT;
BEGIN
  -- Get user email before deleting (for logging)
  SELECT email INTO deleted_user_email FROM auth.users WHERE id = user_id;
  
  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Log the deletion
  RAISE NOTICE 'Deleted user from auth: % (email: %)', user_id, COALESCE(deleted_user_email, 'unknown');
  
  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'User deleted successfully',
    'deleted_user_id', user_id,
    'deleted_email', deleted_user_email
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error deleting user: %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'user_id', user_id
  );
END;
$$;

-- Grant permission to authenticated users (adjust as needed)
GRANT EXECUTE ON FUNCTION public.delete_auth_user(uuid) TO authenticated;

-- Verify the function was created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'delete_auth_user'
  AND routine_schema = 'public';

-- ============================================================================
-- TESTING
-- ============================================================================
-- Uncomment to test (replace with actual user ID):
-- SELECT delete_auth_user('fab6e9eb-8754-46b9-b210-475b6a076758'::uuid);
