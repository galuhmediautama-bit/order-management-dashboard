-- Check Advertiser users in database
SELECT id, email, name, role, status FROM users WHERE role = 'Advertiser' LIMIT 10;

-- Also check if Sjamsaja user is in there with correct role
SELECT id, email, name, role, status FROM users WHERE email LIKE '%sjamsaja%' OR email LIKE '%ari%' OR email LIKE '%syahrul%';
