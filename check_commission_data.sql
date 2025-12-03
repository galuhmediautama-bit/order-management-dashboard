-- QUICK TEST: Jalankan query ini untuk cek apakah variantCombinations menyimpan commission
-- Paste di Supabase SQL Editor

-- Lihat form terakhir yang diupdate dan cek isi variantCombinations-nya
SELECT 
    id,
    title,
    jsonb_pretty("variantCombinations") as variants_detail,
    "variantCombinations" -> 0 ->> 'csCommission' as first_cs_commission,
    "variantCombinations" -> 0 ->> 'advCommission' as first_adv_commission,
    "variantCombinations" -> 0 ->> 'sellingPrice' as first_selling_price
FROM forms
ORDER BY id DESC
LIMIT 5;
