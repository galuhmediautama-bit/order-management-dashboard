-- Fix role untuk user 5jamsaja@gmail.com
-- Issue: Role di database tidak match dengan profil

-- 1. Check current role
SELECT id, email, name, role, status 
FROM users 
WHERE email = '5jamsaja@gmail.com';

-- 2. Option A: Update role ke Advertiser (jika Advertiser yang benar)
-- UPDATE users 
-- SET role = 'Advertiser'
-- WHERE email = '5jamsaja@gmail.com';

-- 3. Option B: Update role ke Customer service (jika CS yang benar)
-- UPDATE users 
-- SET role = 'Customer service'
-- WHERE email = '5jamsaja@gmail.com';

-- 4. Verify update
-- SELECT id, email, name, role, status 
-- FROM users 
-- WHERE email = '5jamsaja@gmail.com';

-- INSTRUCTIONS:
-- 1. Jalankan query #1 untuk check current role
-- 2. Uncomment salah satu Option A atau B sesuai role yang benar
-- 3. Jalankan query update
-- 4. Jalankan query #4 untuk verify
-- 5. Refresh browser / re-login untuk melihat perubahan
