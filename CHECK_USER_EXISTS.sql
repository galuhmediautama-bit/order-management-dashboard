-- Check if user 5jamsaja@gmail.com exists in database
SELECT 
    id,
    email,
    name,
    role,
    status,
    created_at
FROM public.users 
WHERE email = '5jamsaja@gmail.com';

-- If no results above, then user not in users table!
-- Need to check auth.users table:

SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email = '5jamsaja@gmail.com';

-- If user exists in auth.users but NOT in public.users,
-- then we need to CREATE the user record in public.users table

-- To fix: Insert user into users table if missing
-- Replace the ID and email below with actual values from auth.users
INSERT INTO public.users (id, email, name, role, status, created_at)
VALUES (
    '2ea52886-badf-43e1-814a-89878ee43851',  -- Use actual ID from auth.users
    '5jamsaja@gmail.com',
    'Sjamsaja',  -- Or get from auth.users.user_metadata
    'Advertiser',
    'Aktif',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = '5jamsaja@gmail.com',
    role = 'Advertiser',
    status = 'Aktif';
