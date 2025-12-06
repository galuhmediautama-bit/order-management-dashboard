-- Fix Role untuk user 5jamsaja@gmail.com
-- User ini seharusnya Advertiser, bukan Customer service

-- 1. SEBELUM UPDATE: Cek data current user
SELECT 
    id,
    name,
    email,
    role,
    status,
    "assignedBrandIds",
    created_at
FROM users 
WHERE email = '5jamsaja@gmail.com';

-- 2. UPDATE ROLE ke Advertiser
UPDATE users 
SET role = 'Advertiser'
WHERE email = '5jamsaja@gmail.com';

-- 3. SETELAH UPDATE: Verifikasi perubahan
SELECT 
    id,
    name,
    email,
    role,
    status,
    "assignedBrandIds",
    created_at
FROM users 
WHERE email = '5jamsaja@gmail.com';

-- 4. OPTIONAL: Jika user ini perlu assign brand IDs untuk Advertiser
-- UPDATE users 
-- SET "assignedBrandIds" = ARRAY['brand-id-1', 'brand-id-2']::text[]
-- WHERE email = '5jamsaja@gmail.com';

-- NOTES:
-- - Role akan berubah dari 'Customer service' ke 'Advertiser'
-- - Advertiser memiliki akses ke: Dashboard, Products, Forms, Reports, Ad Reports, Earnings
-- - Jika user ini mengelola brand tertentu, pastikan assignedBrandIds diisi
-- - Setelah update, user perlu logout dan login kembali untuk refresh permissions
