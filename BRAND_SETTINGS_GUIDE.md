# Brand Settings Implementation Guide

## Deskripsi Fitur

Fitur Brand Settings memungkinkan pengguna untuk mengatur default settings per brand yang akan mempengaruhi:
- Produk (default bank account, QRIS, warehouse)
- Formulir (payment options, shipping defaults)
- Pesanan (commission configuration, warehouse routing)

## Struktur Data

### BankAccount
```typescript
interface BankAccount {
  id: string;                // Unique ID (timestamp)
  bankName: string;          // Nama bank (e.g., "BCA", "Mandiri")
  accountHolder: string;     // Nama pemegang rekening
  accountNumber: string;     // Nomor rekening
  isDefault: boolean;        // Hanya satu yang boleh true per brand
}
```

### QRISData
```typescript
interface QRISData {
  id: string;                // Unique ID (timestamp)
  displayName: string;       // Nama untuk display (e.g., "QRIS Utama", "QRIS Backup")
  qrisCode: string;          // URL gambar QRIS (disimpan di Supabase Storage)
  isDefault: boolean;        // Hanya satu yang boleh true per brand
}
```

### Warehouse (Gudang)
```typescript
interface Warehouse {
  id: string;                // Unique ID (timestamp)
  name: string;              // Nama gudang (e.g., "Gudang Jakarta", "Gudang Surabaya")
  address: string;           // Alamat lengkap
  phone: string;             // Nomor telepon
  email?: string;            // Email (optional)
  city?: string;             // Kota
  province?: string;         // Provinsi
  postalCode?: string;       // Kode pos
  isDefault: boolean;        // Hanya satu yang boleh true per brand
}
```

### BrandSettings (Root)
```typescript
interface BrandSettings {
  brandId: string;                    // Reference ke brands.id
  bankAccounts: BankAccount[];        // Array rekening bank
  qrisPayments: QRISData[];           // Array QRIS codes
  warehouses: Warehouse[];            // Array gudang
}
```

## Database Schema

```sql
CREATE TABLE brand_settings (
    id UUID PRIMARY KEY,
    brandId UUID UNIQUE REFERENCES brands(id),
    bankAccounts JSONB,          -- Stored as JSON array
    qrisPayments JSONB,          -- Stored as JSON array
    warehouses JSONB,            -- Stored as JSON array
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP
);
```

**Jalankan:** `supabase_brand_settings.sql` di Supabase SQL Editor

## UI Components

### BrandSettingsModal
**File:** `components/BrandSettingsModal.tsx`

**Props:**
```typescript
interface BrandSettingsModalProps {
    brandId: string;           // ID brand yang sedang diedit
    brandName: string;         // Nama brand untuk display
    onClose: () => void;       // Callback saat modal ditutup
}
```

**Fitur:**
- 3 tab: Rekening Bank, QRIS, Gudang
- Add/Edit/Delete untuk setiap item
- Set as default toggle
- Auto-save dengan Supabase upsert
- Toast notifications untuk feedback

### BrandsPage Integration
**File:** `pages/BrandsPage.tsx`

**Perubahan:**
1. Import BrandSettingsModal
2. State untuk manage settings modal open/close
3. Tombol settings (⚙️) di action column setiap brand
4. Modal render di bawah BrandModal

**Tombol Settings:**
- Icon: Gear (⚙️)
- Position: Sebelum Edit dan Delete buttons
- Hover color: Indigo-600

## Workflow

### Menambah Settings Baru
1. User klik tombol ⚙️ di brand card
2. BrandSettingsModal terbuka
3. User klik tab yang diinginkan (Rekening/QRIS/Gudang)
4. User klik "Tambah Rekening/QRIS/Gudang"
5. Form muncul dengan input fields
6. User isi data dan klik "Simpan"
7. Item ditambah ke state lokal
8. User klik "Simpan Pengaturan" di footer modal
9. Data disimpan ke Supabase dengan upsert
10. Modal menutup otomatis

### Mengubah Default Item
1. Di tab mana pun, cari item yang ingin dijadikan default
2. Klik tombol "Jadikan Utama"
3. Item tersebut akan di-set `isDefault: true`, yang lainnya `false`
4. Klik "Simpan Pengaturan" untuk persist
5. Default indicator berubah ke "Utama"

### Menghapus Item
1. Temukan item yang ingin dihapus
2. Klik tombol trash (🗑️)
3. Item dihapus dari state lokal
4. Klik "Simpan Pengaturan" untuk confirm
5. Jika item tersebut adalah default, item berikutnya menjadi default
6. Toast muncul: "Gudang berhasil dihapus"

## Integrasi dengan Features Lain

### Products Page
**Planned:** Saat membuat product baru, tampilkan default warehouse dari brand
- Select box untuk warehouse akan ter-populate otomatis dengan default warehouse
- User dapat override jika diperlukan

### Forms Page
**Planned:** Form payment settings akan menggunakan default bank & QRIS dari brand
- Show default payment methods dari brand settings
- Allow form-level override

### Orders Page
**Planned:** Order will automatically use:
- Default bank account untuk invoice/payment
- Default QRIS untuk checkout
- Default warehouse untuk shipping address

## File Upload (QRIS Images)

QRIS codes disimpan di Supabase Storage dengan path: `qris/{brandId}/{timestamp}.png`

**Upload Handler:**
```typescript
const qrisUrl = await uploadFileAndGetURL(newQRIS.qrisFile, 'qris');
```

**Hasil:** Public URL accessible di Forms dan Orders

## Error Handling

- **Validation:** Field required di-check sebelum save
- **Unique Default:** Sistem ensure hanya satu default per category
- **Upload Errors:** Catch dan show toast dengan error message
- **Database Errors:** Fallback graceful dengan toast
- **No Items:** Empty state message di setiap tab

## Performance Considerations

1. **Lazy Load:** Settings hanya di-fetch saat modal dibuka
2. **Upsert:** Single database call untuk save semua settings
3. **UI State:** Changes reflect instantly di UI
4. **Image Storage:** QRIS images di-compress client-side sebelum upload

## Future Enhancements

1. **Backup Settings:** Allow duplicate existing settings ke brand baru
2. **Bulk Upload:** CSV upload untuk multiple warehouses
3. **Template Settings:** Presets untuk industry standards
4. **Validation Rules:** Phone number format, postal code validation
5. **Audit Log:** Track siapa yang edit settings kapan
6. **Settings History:** Rollback ke previous settings version

## Troubleshooting

### Settings tidak tersimpan
- Check Supabase connection
- Verify `brand_settings` table exists
- Check RLS policies enabled correctly

### QRIS image tidak ter-upload
- Verify `uploadFileAndGetURL` function berfungsi
- Check Supabase Storage bucket permissions
- Check file size (harus < 5MB)

### Default tidak ter-set
- Ensure only ONE item punya `isDefault: true` per category
- Check data di Supabase untuk validation

## Testing Checklist

- [ ] Create brand settings dari scratch
- [ ] Add bank account dengan validation
- [ ] Add QRIS dengan image upload
- [ ] Add warehouse dengan optional fields
- [ ] Set item sebagai default
- [ ] Edit existing item
- [ ] Delete item
- [ ] Verify data di Supabase
- [ ] Verify QRIS image URL accessible
- [ ] Test with slow network (delayed save)
- [ ] Test modal close/open multiple times
- [ ] Test empty state UI
- [ ] Test with multiple settings per brand
- [ ] Test dark mode styling

---

**Last Updated:** 2024
**Related Files:** types.ts, BrandsPage.tsx, BrandSettingsModal.tsx, supabase_brand_settings.sql
