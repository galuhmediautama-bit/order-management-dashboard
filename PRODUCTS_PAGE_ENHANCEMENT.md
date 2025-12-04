# ProductsPage Enhancement - Fitur Terjual dan Form Count

## Ringkasan Perubahan

ProductsPage telah dienhance dengan menambahkan informasi jumlah produk terjual dan jumlah form yang diassign, serta mengubah aksi menjadi dropdown menu yang lebih lengkap.

## Fitur yang Ditambahkan

### 1. Kolom "Terjual" (Sales Count)
- Menampilkan jumlah pesanan yang sudah delivered
- Dihitung dari table `orders` dengan filter:
  - `product_id` = product ID
  - `status` = 'Delivered'
- Badge berwarna biru dengan styling modern

### 2. Kolom "Form" (Form Count)
- Menampilkan jumlah form yang diassign ke produk
- Dihitung dari table `forms` dengan filter:
  - `product_id` = product ID
- Badge berwarna purple dengan styling modern

### 3. Dropdown Menu Aksi
Mengganti tombol aksi individual dengan dropdown menu yang berisi:

| Menu | Deskripsi | Navigasi |
|------|-----------|----------|
| **Edit Produk** | Edit informasi produk induk | `/produk/edit/{productId}` |
| **Lihat Form** | Melihat daftar form yang diassign | `/produk/{productId}/forms` |
| **Penjualan** | Melihat detail penjualan produk | `/produk/{productId}/sales` |
| **Analytics** | Melihat analytics dan performance | `/produk/{productId}/analytics` |
| **Hapus Produk** | Menghapus produk (soft delete) | - |

## Implementasi Teknis

### State Management
```typescript
interface ProductStats {
    [productId: string]: {
        salesCount: number;
        formCount: number;
    };
}

const [productStats, setProductStats] = useState<ProductStats>({});
const [openDropdown, setOpenDropdown] = useState<string | null>(null);
```

### Fetch Product Stats
Function `fetchProductStats()` melakukan:
1. Query ke table `forms` menggunakan `productService.getProductForms()`
2. Query ke table `orders` dengan filter status 'Delivered'
3. Menyimpan hasil ke state `productStats`

```typescript
const fetchProductStats = async () => {
    // ... untuk setiap product
    const forms = await productService.getProductForms(product.id);
    const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('product_id', product.id)
        .eq('status', 'Delivered');
};
```

### Dropdown Menu Styling
- Absolute positioning dengan `z-10`
- Dark mode support dengan `dark:` classes
- Icon SVG inline untuk fitur-fitur
- Responsive border styling

## Database Requirements

### Kolom yang Diperlukan

1. **Table `forms`**
   - `product_id` UUID (FK to products)
   - Already exists (sudah ada di schema)

2. **Table `orders`**
   - `product_id` UUID (FK to products)
   - `status` field (existing)
   - **PERLU DITAMBAHKAN**: Migration script `supabase_add_product_id_to_orders.sql`

### SQL Migration

File: `supabase_add_product_id_to_orders.sql`

```sql
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);

-- Link orders to products via forms
UPDATE orders
SET product_id = f.product_id
FROM forms f
WHERE orders.form_id = f.id
AND orders.product_id IS NULL
AND f.product_id IS NOT NULL;
```

### Langkah Eksekusi
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy-paste isi `supabase_add_product_id_to_orders.sql`
4. Execute script
5. Verifikasi column `product_id` ada di table `orders`

## Files yang Dimodifikasi

### 1. `pages/ProductsPage.tsx`
- Menambahkan import `EllipsisVerticalIcon`
- Menambahkan state untuk `productStats` dan `openDropdown`
- Menambahkan function `fetchProductStats()`
- Menambahkan kolom "Terjual" dan "Form" di table header
- Menambahkan dropdown menu di table rows
- Call `fetchProductStats()` di useEffect

### 2. `components/icons/EllipsisVerticalIcon.tsx` (BARU)
Icon SVG untuk dropdown menu button (tiga titik vertikal)

## Future Navigation Routes

Routes berikut masih perlu diimplementasikan di `App.tsx`:
- `/produk/:productId/forms` - Melihat form yang diassign
- `/produk/:productId/sales` - Melihat penjualan produk
- `/produk/:productId/analytics` - Melihat analytics produk

Template pages dapat dibuat nanti sesuai kebutuhan.

## Styling Details

### Badge Styling
```tsx
// Sales Count (Biru)
<span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
    {productStats[product.id]?.salesCount || 0}
</span>

// Form Count (Purple)
<span className="inline-flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold">
    {productStats[product.id]?.formCount || 0}
</span>
```

### Dropdown Styling
- **Position**: Absolute top-right
- **Shadow**: `shadow-lg`
- **Border**: `border border-slate-200 dark:border-slate-600`
- **Dark Mode**: Full support dengan `dark:` prefix
- **Responsive**: Dropdown tertutup otomatis saat navigasi

## Performance Notes

- Stats diambil saat component mount (seiring dengan products)
- Query terpisah per product bisa dioptimalkan dengan SQL aggregation query
- Pertimbangkan caching jika banyak products

## Testing Checklist

- [ ] Database migration script sudah diexecute
- [ ] Kolom "Terjual" menampilkan angka dengan benar
- [ ] Kolom "Form" menampilkan angka dengan benar
- [ ] Dropdown menu terbuka/tutup dengan benar
- [ ] Semua menu items navigasi dengan benar
- [ ] Dark mode styling works properly
- [ ] Icon display correctly
- [ ] Responsive design on mobile

## Notes untuk Developer

Jika ada pertanyaan atau perlu modifikasi:
1. Badge colors dapat diubah (blue, purple, green, etc.)
2. Menu items dapat ditambah/dikurangi
3. Query dapat dioptimalkan dengan aggregation function
4. Dropdown position dapat disesuaikan dengan parent container

---

**Last Updated**: December 4, 2025
**Status**: Ready for Database Migration
