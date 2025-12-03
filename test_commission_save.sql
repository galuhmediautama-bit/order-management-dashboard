-- SQL untuk test apakah csCommission dan advCommission bisa disimpan di variantCombinations
-- Jalankan di Supabase SQL Editor untuk testing

-- 1. Cek struktur tabel forms
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'forms' AND column_name IN ('variantCombinations', 'productOptions');

-- 2. Test insert data dengan csCommission dan advCommission
INSERT INTO forms (
    id, 
    title, 
    "mainImage", 
    description,
    "variantCombinations",
    "productOptions",
    "submissionCount"
) VALUES (
    gen_random_uuid(),
    'Test Form Komisi',
    'https://via.placeholder.com/300',
    'Test deskripsi',
    '[
        {
            "attributes": {"Warna": "Merah", "Ukuran": "M"},
            "sellingPrice": 100000,
            "costPrice": 50000,
            "csCommission": 10000,
            "advCommission": 5000,
            "weight": 500
        },
        {
            "attributes": {"Warna": "Biru", "Ukuran": "L"},
            "sellingPrice": 120000,
            "costPrice": 60000,
            "csCommission": 12000,
            "advCommission": 6000,
            "weight": 600
        }
    ]'::jsonb,
    '[
        {
            "id": 1,
            "name": "Warna",
            "values": ["Merah", "Biru"],
            "displayStyle": "dropdown"
        },
        {
            "id": 2,
            "name": "Ukuran",
            "values": ["M", "L"],
            "displayStyle": "dropdown"
        }
    ]'::jsonb,
    0
) RETURNING id, title, "variantCombinations";

-- 3. Query untuk melihat data yang baru disimpan (last 3 forms)
SELECT 
    id, 
    title,
    "variantCombinations"
FROM forms 
ORDER BY "createdAt" DESC
LIMIT 3;

-- 4. Test update variantCombinations dengan commission
-- (Uncomment dan ganti 'YOUR_FORM_ID' dengan form ID yang ingin diupdate)
-- UPDATE forms
-- SET "variantCombinations" = '[
--     {
--         "attributes": {"Warna": "Merah"},
--         "sellingPrice": 100000,
--         "costPrice": 50000,
--         "csCommission": 15000,
--         "advCommission": 7500,
--         "weight": 500
--     }
-- ]'::jsonb
-- WHERE id = 'YOUR_FORM_ID'
-- RETURNING id, "variantCombinations";

-- 5. Hapus test data (jalankan setelah testing selesai)
-- Ganti 'YOUR_UUID_HERE' dengan UUID dari hasil insert
-- DELETE FROM forms WHERE id = 'YOUR_UUID_HERE'::uuid;
