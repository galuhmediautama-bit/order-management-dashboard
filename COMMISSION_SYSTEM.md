# 💰 Sistem Komisi Ganda (CS & Advertiser)

## Penjelasan Sistem Komisi

Aplikasi Order Management Dashboard sekarang mendukung **2 jenis komisi terpisah**:

### 1. **Komisi CS (Customer Service)** 
- Komisi yang diterima oleh CS yang menangani order
- Dihitung berdasarkan order yang statusnya `Shipped` atau `Delivered`
- Komisi diberikan kepada CS yang ter-assign di order (`assignedCsId`)

### 2. **Komisi Advertiser**
- Komisi yang diterima oleh Advertiser yang mengelola brand/produk
- Dihitung berdasarkan order dari brand yang di-assign ke Advertiser
- Komisi diberikan kepada Advertiser berdasarkan `assignedBrandIds`

---

## 🎯 Cara Kerja

### A. Pengaturan Komisi di Form Editor

1. **Buka Form Editor** (`/formulir/edit/:formId`)
2. **Scroll ke section "Varian Produk & Harga"**
3. Di tabel varian, Anda akan melihat 2 kolom komisi:
   - **Komisi CS**: Komisi per penjualan untuk Customer Service
   - **Komisi Adv**: Komisi per penjualan untuk Advertiser
4. Masukkan nilai komisi untuk setiap varian produk

**Contoh:**
| Varian | Harga Jual | Komisi CS | Komisi Adv |
|--------|------------|-----------|------------|
| Merah / M | Rp 150,000 | Rp 10,000 | Rp 5,000 |
| Biru / L | Rp 180,000 | Rp 12,000 | Rp 6,000 |

### B. Perhitungan Komisi Otomatis

Ketika order dibuat dari form public:
1. Sistem mengambil nilai `csCommission` dan `advCommission` dari varian yang dipilih
2. Nilai komisi disimpan di database order sebagai **snapshot**:
   - `csCommission`: Komisi untuk CS
   - `advCommission`: Komisi untuk Advertiser
   - `commissionSnapshot`: (Legacy) tetap disimpan untuk backward compatibility

### C. Distribusi Komisi

#### **Komisi CS:**
- Hanya dihitung untuk order yang **assigned ke CS** (`assignedCsId`)
- Hanya untuk order dengan status **`Shipped`** atau **`Delivered`**
- Total komisi CS dihitung di halaman **Penghasilan** (`/penghasilan`)

#### **Komisi Advertiser:**
- Dihitung berdasarkan **Brand yang di-assign** ke user Advertiser
- User Advertiser memiliki `assignedBrandIds` (array of brand IDs)
- Komisi dihitung untuk semua order dari brand tersebut yang **`Shipped`** atau **`Delivered`**
- Total komisi Advertiser dihitung di halaman **Penghasilan** (`/penghasilan`)

---

## 📊 Tampilan di Halaman Penghasilan

### Untuk Super Admin / Admin / Keuangan (Team View)
Tabel menampilkan:
- **Nama**: Nama user
- **Peran**: Role (CS / Advertiser)
- **Kelas**: Rank berdasarkan performa
- **Omzet**: Total revenue yang dihasilkan
- **Gaji Pokok**: Base salary
- **Komisi**: Total komisi (CS atau Advertiser sesuai role)
- **Total Pendapatan**: Gaji Pokok + Komisi

### Untuk CS / Advertiser (Personal View)
- Kartu performa dengan rank dan metrics
- Total komisi yang diterima
- Rincian perhitungan komisi

---

## 🔧 Database Schema

### Order Table
```typescript
{
  id: string
  assignedCsId?: string
  brandId?: string
  status: OrderStatus
  // ... fields lainnya
  
  // Legacy field (deprecated tapi tetap ada)
  commissionSnapshot?: number  // Backward compatibility
  
  // New fields
  csCommission?: number       // Komisi CS
  advCommission?: number      // Komisi Advertiser
}
```

### VariantCombination Type
```typescript
{
  attributes: Record<string, string>
  sellingPrice: number
  // ... fields lainnya
  
  // Legacy field (deprecated)
  commissionPrice?: number
  
  // New fields
  csCommission?: number      // Komisi CS per varian
  advCommission?: number     // Komisi Advertiser per varian
}
```

### User Type
```typescript
{
  id: string
  role: UserRole
  baseSalary?: number
  assignedBrandIds?: string[]  // Array brand IDs for Advertiser
  // ... fields lainnya
}
```

---

## 🔄 Backward Compatibility

Sistem tetap mendukung data lama:
- Jika `csCommission` dan `advCommission` **tidak ada**, sistem akan fallback ke `commissionPrice` sebagai komisi CS
- Field `commissionSnapshot` di Order tetap diisi untuk backward compatibility
- Old forms masih bisa digunakan dengan komisi lama

---

## 📝 Contoh Skenario

### Skenario 1: Order dengan CS Assignment
```
Order Details:
- Product: Sepatu Merah / Size 42
- Total: Rp 200,000
- CS Assigned: Budi (CS ID: cs-001)
- Brand ID: brand-nike
- Status: Shipped

Commission Snapshot:
- csCommission: Rp 15,000 → Masuk ke komisi Budi
- advCommission: Rp 8,000 → Masuk ke komisi Advertiser yang handle brand-nike
```

### Skenario 2: Multiple Brand Assignment
```
User Advertiser: Andi
assignedBrandIds: ['brand-nike', 'brand-adidas']

Orders yang dihitung komisi Andi:
- Semua order dengan brandId = 'brand-nike' (Shipped/Delivered)
- Semua order dengan brandId = 'brand-adidas' (Shipped/Delivered)

Total Komisi Andi = Sum of (advCommission) dari semua order tersebut
```

---

## ⚠️ Catatan Penting

1. **Komisi hanya dihitung untuk order dengan status Shipped/Delivered**
2. **Komisi CS** hanya untuk order yang punya `assignedCsId`
3. **Komisi Advertiser** dihitung berdasarkan `brandId` dan `assignedBrandIds`
4. Nilai komisi di-**snapshot** saat order dibuat (tidak berubah jika form di-edit)
5. Jika tidak ada komisi yang di-set, nilai default adalah 0

---

## 🚀 Next Steps

Untuk menggunakan sistem komisi:
1. ✅ Set nilai komisi CS dan Adv di setiap form/varian
2. ✅ Assign brand ke user Advertiser di User Management
3. ✅ Pastikan CS assignment berjalan normal
4. ✅ Monitor komisi di halaman Penghasilan

---

**Sistem komisi ganda siap digunakan!** 🎉
