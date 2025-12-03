# Fix: Komisi CS dan Komisi Adv Tersimpan ke Database

## Masalah
- Field `csCommission` dan `advCommission` terlihat di UI tapi tidak tersimpan ke database
- Database sudah benar dan bisa menyimpan data commission (sudah ditest dengan SQL)

## Penyebab
Ada 3 masalah yang ditemukan:

### 1. **FormEditorPage.tsx - handleCombinationChange()**
- Function tidak memiliki else branch untuk field non-numeric
- Menyebabkan perubahan tidak tersimpan untuk field tertentu

### 2. **utils.ts - normalizeForm()**  
- Baris 130-132: Mengisi default value dengan `0` untuk commission
- Baris 276-283: Migration logic menimpa commission dengan `0`
- Menggunakan `?? 0` menyebabkan nilai `undefined` diganti dengan `0`

### 3. **FormEditorPage.tsx - useEffect regenerate combinations**
- Baris 999-1010: Saat variant combinations diregenerate, `csCommission` dan `advCommission` tidak dipreserve dari existing combinations
- Hanya preserve: sellingPrice, strikethroughPrice, weight, costPrice, commissionPrice

## Solusi yang Diterapkan

### 1. Fix handleCombinationChange
```typescript
// Tambahkan else branch untuk handle field lainnya
const handleCombinationChange = (index: number, field: keyof VariantCombination, value: any) => {
    if (field === 'sellingPrice' || ...) {
        const numValue = value === '' ? undefined : parseFloat(value);
        setForm(prev => {...});
    } else {
        // NEW: Handle other fields
        setForm(prev => {
            if (!prev) return null;
            const newCombinations = [...prev.variantCombinations];
            newCombinations[index] = { ...newCombinations[index], [field]: value };
            return { ...prev, variantCombinations: newCombinations };
        });
    }
};
```

### 2. Fix normalizeForm - Gunakan undefined bukan 0
```typescript
// Baris 129-133 - SEBELUM:
variantCombinations: (formToEdit.variantCombinations || []).map(combo => ({
    ...combo,
    csCommission: combo.csCommission ?? combo.commissionPrice ?? 0,  // ❌ Default ke 0
    advCommission: combo.advCommission ?? 0,  // ❌ Default ke 0
}))

// SESUDAH:
variantCombinations: (formToEdit.variantCombinations || []).map(combo => ({
    ...combo,
    csCommission: combo.csCommission !== undefined ? combo.csCommission : (combo.commissionPrice ?? undefined),  // ✅ Keep undefined
    advCommission: combo.advCommission !== undefined ? combo.advCommission : undefined,  // ✅ Keep undefined
}))

// Baris 268-284 - SEBELUM:
return {
    ...combo,
    csCommission: combo.csCommission ?? (combo as any).commissionPrice ?? 0,  // ❌ Default ke 0
    advCommission: combo.advCommission ?? 0  // ❌ Default ke 0
};

// SESUDAH:
return {
    ...combo,
    csCommission: combo.csCommission !== undefined ? combo.csCommission : ((combo as any).commissionPrice ?? undefined),  // ✅ Keep undefined
    advCommission: combo.advCommission !== undefined ? combo.advCommission : undefined  // ✅ Keep undefined
};
```

### 3. Fix Regenerate Combinations - Preserve Commission
```typescript
// Baris 997-1012 - SEBELUM:
const existing = existingCombinationsMap.get(key);
return { 
    attributes, 
    sellingPrice: existing?.sellingPrice ?? 0, 
    strikethroughPrice: existing?.strikethroughPrice, 
    weight: existing?.weight, 
    costPrice: existing?.costPrice, 
    commissionPrice: existing?.commissionPrice,
    // ❌ csCommission dan advCommission HILANG!
};

// SESUDAH:
const existing = existingCombinationsMap.get(key);
return { 
    attributes, 
    sellingPrice: existing?.sellingPrice ?? 0, 
    strikethroughPrice: existing?.strikethroughPrice, 
    weight: existing?.weight, 
    costPrice: existing?.costPrice, 
    commissionPrice: existing?.commissionPrice,
    csCommission: existing?.csCommission,  // ✅ Preserve
    advCommission: existing?.advCommission,  // ✅ Preserve
};
```

## Cara Testing

1. Buka aplikasi di browser: http://localhost:3000
2. Login dan buat/edit formulir
3. Isi field **Komisi CS** dan **Komisi Adv** di tabel variant combinations
4. Klik **Simpan Formulir**
5. Cek Browser Console untuk logs:
   - "Form state before save" - pastikan commission ada
   - "formToSave after JSON clone" - pastikan commission masih ada
   - "Saving form data" - pastikan commission dikirim ke Supabase
6. Reload halaman atau buka formulir lagi
7. Pastikan nilai commission masih tersimpan

## Console Logs untuk Debugging

Application sudah dilengkapi dengan console logs:
```typescript
console.log('Form state before save:', {
    variantCombinations: form.variantCombinations,
    firstVariant: form.variantCombinations[0]
});

console.log('Saving form data:', {
    firstVariantDetails: {
        csCommission: formToSave.variantCombinations[0].csCommission,
        advCommission: formToSave.variantCombinations[0].advCommission,
    }
});
```

## Verifikasi Database

Jalankan query ini di Supabase SQL Editor:
```sql
SELECT 
    id, 
    title,
    "variantCombinations"
FROM forms 
WHERE title ILIKE '%test%'
ORDER BY "createdAt" DESC 
LIMIT 5;
```

Commission data seharusnya muncul di JSONB field `variantCombinations`:
```json
[{
  "attributes": {"Warna": "Merah"},
  "sellingPrice": 100000,
  "csCommission": 10000,
  "advCommission": 5000
}]
```

## File yang Diubah
- ✅ `pages/FormEditorPage.tsx` - Fix handleCombinationChange & preserve commission saat regenerate
- ✅ `utils.ts` - Fix normalizeForm untuk tidak overwrite dengan 0
- ✅ Development server running di http://localhost:3000

## Status
✅ **SELESAI** - Commission fields sekarang harus bisa tersimpan ke database.

Silakan test dengan:
1. Buka formulir
2. Isi commission fields
3. Simpan
4. Reload dan pastikan data masih ada
