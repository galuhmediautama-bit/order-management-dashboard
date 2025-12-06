-- Debug Script untuk Customer Service Role Issue
-- Jalankan di Supabase SQL Editor untuk diagnosa masalah

-- 1. Cek user 5jamsaja@gmail.com
SELECT 
    id,
    name,
    email,
    role,
    status,
    "createdAt",
    "lastLogin"
FROM users 
WHERE email = '5jamsaja@gmail.com';

-- 2. Cek semua users dengan role yang mengandung "customer" atau "service"
SELECT 
    id,
    name,
    email,
    role,
    status
FROM users 
WHERE LOWER(role) LIKE '%customer%' OR LOWER(role) LIKE '%service%'
ORDER BY "createdAt" DESC;

-- 3. Cek role permissions di settings table
SELECT 
    id,
    "rolePermissions"
FROM settings 
WHERE id = 'rolePermissions';

-- 4. Cek apakah ada variations dalam penulisan role Customer Service
SELECT 
    DISTINCT role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- SOLUSI: Jika role tidak match, update dengan query berikut:

-- Option A: Fix specific user 5jamsaja@gmail.com ke role yang benar
-- UPDATE users 
-- SET role = 'Customer service'  -- PERHATIAN: 's' nya kecil!
-- WHERE email = '5jamsaja@gmail.com';

-- Option B: Standardize semua users dengan role customer service variations
-- UPDATE users 
-- SET role = 'Customer service'  
-- WHERE LOWER(role) = 'customer service' OR role = 'Customer Service' OR role = 'cs';

-- NOTES:
-- - Role HARUS PERSIS: 'Customer service' (dengan 's' kecil)
-- - Ini sesuai dengan type definition di types.ts
-- - Jika tidak exact match, role permissions tidak akan bekerja
