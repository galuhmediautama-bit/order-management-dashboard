-- Delete duplicate user record
-- Keep the newer one (2ea52886-badf-43e1-814a-89878ee43851)
-- Delete the old one (530829de-3284-44e8-8bc4-369b0907cab2)

DELETE FROM public.users 
WHERE id = '530829de-3284-44e8-8bc4-369b0907cab2' AND email = '5jamsaja@gmail.com';

-- Verify only one record remains
SELECT *
FROM public.users 
WHERE email = '5jamsaja@gmail.com';
