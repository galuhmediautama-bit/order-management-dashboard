# LOGIKA PRODUK: TANPA VARIANT, SINGLE VARIANT, MULTI VARIANT

## **1. TANPA VARIANT**

**Deskripsi:** Produk tidak memiliki pilihan apapun. Semua informasi harga langsung melekat pada produk utama.

**Data yang diperlukan:**
- Harga Jual ✓
- Harga Coret
- Harga Modal
- Komisi CS
- Komisi Advertiser
- Berat (gram)
- Stok Awal

**Contoh:**
```
Laptop Gaming Pro
├─ Harga Jual: 15.000.000
├─ Harga Coret: 18.000.000
├─ Harga Modal: 12.000.000
├─ Komisi CS: 500.000
├─ Komisi Advertiser: 750.000
├─ Berat: 2000 gram
└─ Stok Awal: 50
```

**Implementasi:**
- UI: Tabel horizontal 2 kolom (Harga Jual | Harga Coret, dll)
- Database: Semua nilai di `basePrice`, `comparePrice`, `costPrice`, `csCommission`, `advCommission`, `weight`, `stock`
- `variants` array: **KOSONG** `[]`
- `variantOptions` array: **KOSONG** `[]`

---

## **2. SINGLE VARIANT**

**Deskripsi:** Produk hanya memiliki **1 jenis opsi** (contoh: warna saja, atau ukuran saja).

**Data yang diperlukan per opsi:**
- Nama Varian (misal: "Merah", "Putih", "Biru")
- Harga Jual ✓
- Harga Coret
- Harga Modal
- Komisi CS
- Komisi Advertiser
- Berat (gram)
- Stok Awal

**Contoh:**
```
Kaos Polos
├─ Varian: Warna
│  ├─ Merah
│  │  ├─ Harga Jual: 50.000
│  │  ├─ Harga Coret: 60.000
│  │  ├─ Stok: 100
│  │  └─ ...
│  ├─ Putih
│  │  ├─ Harga Jual: 50.000
│  │  ├─ Harga Coret: 60.000
│  │  ├─ Stok: 80
│  │  └─ ...
│  └─ Biru
│     ├─ Harga Jual: 50.000
│     ├─ Harga Coret: 60.000
│     ├─ Stok: 120
│     └─ ...
```

**Implementasi:**
- UI: 1 card/form untuk mengedit data masing-masing varian
- Database: 
  - `variants` array dengan 3 item (Merah, Putih, Biru)
  - `variantOptions` array: **KOSONG** `[]`
- Setiap item dalam `variants` memiliki structure lengkap: `{ name, price, comparePrice, costPrice, csCommission, advCommission, weight, initialStock }`

---

## **3. MULTI VARIANT**

**Deskripsi:** Produk memiliki **2 atau lebih jenis opsi** (contoh: warna + ukuran).

**Data yang diperlukan per kombinasi:**
- Nama Kombinasi (auto-generated: "Merah - M", "Putih - XL", dll)
- Harga Jual ✓
- Harga Coret
- Harga Modal
- Komisi CS
- Komisi Advertiser
- Berat (gram)
- Stok Awal

**Contoh:**
```
T-Shirt
├─ Opsi 1: Warna (Merah, Kuning, Putih)
├─ Opsi 2: Ukuran (M, L, XL)
│
└─ Kombinasi yang dihasilkan (3 × 3 = 9):
   ├─ Merah - M (Harga: 80.000, Stok: 20, ...)
   ├─ Merah - L (Harga: 85.000, Stok: 15, ...)
   ├─ Merah - XL (Harga: 90.000, Stok: 10, ...)
   ├─ Kuning - M (Harga: 80.000, Stok: 25, ...)
   ├─ Kuning - L (Harga: 85.000, Stok: 18, ...)
   ├─ Kuning - XL (Harga: 90.000, Stok: 12, ...)
   ├─ Putih - M (Harga: 80.000, Stok: 30, ...)
   ├─ Putih - L (Harga: 85.000, Stok: 22, ...)
   └─ Putih - XL (Harga: 90.000, Stok: 15, ...)
```

**Implementasi:**
- UI: 
  - Form untuk menambah/edit opsi (Warna, Ukuran)
  - Tombol "Generate Kombinasi" untuk membuat kombinasi otomatis
  - Tabel untuk edit harga per kombinasi (read-only nama kombinasi)
- Database:
  - `variantOptions` array dengan 2 item:
    ```
    [
      { name: "Warna", values: ["Merah", "Kuning", "Putih"] },
      { name: "Ukuran", values: ["M", "L", "XL"] }
    ]
    ```
  - `variants` array dengan 9 item (kombinasi):
    ```
    [
      { name: "Merah - M", price: 80000, comparePrice: 95000, ... },
      { name: "Merah - L", price: 85000, comparePrice: 100000, ... },
      ... (9 total)
    ]
    ```

---

## **TABEL PERBANDINGAN**

| Aspek | Tanpa Variant | Single Variant | Multi Variant |
|-------|---------------|----------------|---------------|
| **Tipe Opsi** | 0 | 1 | 2+ |
| **Contoh** | Laptop (standar) | Kaos (1 warna) | T-Shirt (warna + ukuran) |
| **Jumlah Data Harga** | 1 | N (sesuai opsi) | N × M (kombinasi) |
| **Struktur `variants`** | `[]` (kosong) | `[{ name, price, ... }]` | `[{ name, price, ... }]` |
| **Struktur `variantOptions`** | `[]` (kosong) | `[]` (kosong) | `[{ name, values[] }]` |
| **UI Input** | Tabel 2 kolom | 1 Card per varian | Form opsi + Tabel kombinasi |
| **Kolombinasi Otomatis** | ❌ | ❌ | ✅ (Cartesian product) |

---

## **FLOW DEVELOPMENT**

### **Saat User Memilih Mode:**

1. **Tanpa Variant** → Tampilkan tabel input harga saja
2. **Single Variant** → Tampilkan form tambah varian (manual)
3. **Multi Variant** → Tampilkan form tambah opsi + tombol generate kombinasi

### **Saat User Edit Data:**

1. **Tanpa Variant** → Update field: `basePrice`, `comparePrice`, `costPrice`, `csCommission`, `advCommission`, `weight`, `stock`
2. **Single Variant** → Update array `variants` dengan index tertentu
3. **Multi Variant** → Generate kombinasi dari `variantOptions`, update tabel harga per kombinasi

### **Saat User Simpan:**

1. **Tanpa Variant** → Simpan ke database dengan `variants: []`, `variantOptions: []`
2. **Single Variant** → Simpan `variants` array (1-N item), `variantOptions: []`
3. **Multi Variant** → Simpan `variants` array (kombinasi) + `variantOptions` array

---

## **CHECKLIST IMPLEMENTASI**

- ✅ Mode selection buttons (Tanpa Variant | Single Variant | Multi Variant)
- ✅ Conditional rendering per mode
- ✅ Tanpa Variant: Tabel input harga horizontal 2 kolom
- ✅ Single Variant: Form untuk tambah/edit 1 varian
- ✅ Multi Variant: Form opsi + tombol generate + tabel kombinasi
- ✅ Auto-generate kombinasi (Cartesian product)
- ✅ Preserve existing data saat regenerate kombinasi
- ✅ Save logic untuk setiap mode
- ⏳ Load existing product dan detect mode otomatis

---

## **NOTES**

- Ketika switch mode dari Single → Multi, `variantOptions` akan di-populate dengan default opsi (misal: "Warna", "Ukuran")
- Ketika switch mode dari Multi → Single, hanya variant pertama yang dipertahankan (data yang lain hilang!)
- Kombinasi dihasilkan menggunakan Cartesian product: jika Warna 3 opsi × Ukuran 3 opsi = 9 kombinasi

