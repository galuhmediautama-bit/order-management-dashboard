-- Get all UUIDs from auth.users to map properly
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role_metadata,
  created_at
FROM auth.users
ORDER BY created_at;
