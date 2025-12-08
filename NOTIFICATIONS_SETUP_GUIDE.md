# Notifikasi Database Triggers - Setup Guide

## 📋 Overview

Sistem notifikasi otomatis yang membuat notifikasi di database saat event terjadi:

1. **ORDER_NEW** - Saat order baru dibuat → notify CS + Advertiser
2. **CART_ABANDON** - Saat abandoned cart dibuat → notify Admin
3. **SYSTEM_ALERT** - Saat order status berubah → notify CS

## 🚀 Setup Instructions

### Step 1: Jalankan SQL Triggers

Buka Supabase dashboard → SQL Editor → buat query baru:

```sql
-- Copy-paste seluruh isi dari: scripts/notifications-triggers.sql
```

Atau gunakan Supabase CLI:
```bash
supabase db push  # Jika sudah ada migration
```

### Step 2: Verify Triggers Exist

Cek di SQL Editor:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'trigger_notify%';
```

Should return 3 triggers:
- `trigger_notify_on_new_order`
- `trigger_notify_on_abandoned_cart`
- `trigger_notify_on_order_status_change`

## 📨 Notification Flow

### 1. ORDER_NEW - Saat Order Baru Dibuat

**Trigger**: `notify_on_new_order`

**Siapa yang notifikasi:**
- ✅ CS Agent (jika `orders.assignedCsId` ada)
- ✅ Semua Advertiser yang punya akses ke brand (jika `orders.brandId` ada)

**Isi Notifikasi:**
```json
{
  "type": "ORDER_NEW",
  "title": "Pesanan Baru dari Budi",
  "message": "Pesanan dari Budi (081234567890) - Produk XYZ - Rp 500.000",
  "metadata": {
    "orderId": "uuid-of-order",
    "customerName": "Budi",
    "customerPhone": "081234567890",
    "totalPrice": 500000,
    "productName": "Produk XYZ"
  }
}
```

### 2. CART_ABANDON - Saat Abandoned Cart Dibuat

**Trigger**: `notify_on_abandoned_cart`

**Siapa yang notifikasi:**
- ✅ Semua Super Admin (role = 'Super Admin')
- ✅ Semua Admin (role = 'Admin')
- ✅ Status harus 'Aktif'

**Isi Notifikasi:**
```json
{
  "type": "CART_ABANDON",
  "title": "Keranjang Ditinggalkan - Budi",
  "message": "Budi (081234567890) meninggalkan keranjang di form: Produk XYZ",
  "metadata": {
    "cartId": "uuid-of-cart",
    "customerName": "Budi",
    "customerPhone": "081234567890",
    "formTitle": "Produk XYZ",
    "selectedVariant": "Warna Merah / Size L"
  }
}
```

### 3. SYSTEM_ALERT - Saat Order Status Berubah

**Trigger**: `notify_on_order_status_change`

**Siapa yang notifikasi:**
- ✅ CS Agent (jika `orders.assignedCsId` ada)

**Status yang dinotifikasi:**
- `Processing` → "Pesanan sedang diproses ⏳"
- `Shipped` → "Pesanan sudah dikirim 📦"
- `Delivered` → "Pesanan telah diterima ✅"
- `Canceled` → "Pesanan dibatalkan ❌"

**Isi Notifikasi:**
```json
{
  "type": "SYSTEM_ALERT",
  "title": "📦 Pesanan sudah dikirim",
  "message": "Pesanan uuid-123 dari Budi - Pesanan sudah dikirim",
  "metadata": {
    "orderId": "uuid-123",
    "oldStatus": "Processing",
    "newStatus": "Shipped",
    "customerName": "Budi"
  }
}
```

## 🧪 Test Triggers

### Test 1: Buat Order Baru → Cek Notifikasi

1. Buka form di production: https://form.cuanmax.digital/#/f/al-quran-al-mushawir
2. Isi dan submit order
3. Buka SQL Editor dan jalankan:
```sql
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;
```
4. ✅ Seharusnya ada notifikasi ORDER_NEW untuk CS dan Advertiser

### Test 2: Abandoned Cart → Cek Notifikasi

1. Buka form yang sama
2. Isi nama dan whatsapp (jangan submit)
3. Tunggu 5 detik atau refresh halaman
4. Buka SQL Editor:
```sql
SELECT * FROM abandoned_carts 
ORDER BY timestamp DESC 
LIMIT 1;
```
5. ✅ Seharusnya ada abandoned cart
6. Check notifikasi:
```sql
SELECT * FROM notifications 
WHERE type = 'CART_ABANDON'
ORDER BY created_at DESC 
LIMIT 1;
```

### Test 3: Order Status Update → Cek Notifikasi

1. Buka dashboard → Daftar Pesanan
2. Pilih order → ubah status dari Pending → Processing
3. Check SQL:
```sql
SELECT * FROM notifications 
WHERE type = 'SYSTEM_ALERT'
ORDER BY created_at DESC 
LIMIT 1;
```
4. ✅ Seharusnya ada notifikasi untuk CS

## 📊 Monitor Notifikasi

### Query: Lihat semua notifikasi user (ganti UUID)

```sql
-- Ganti dengan actual user UUID dari auth.users
SELECT 
  id,
  type,
  title,
  message,
  is_read,
  created_at
FROM notifications
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'  -- Replace with actual user UUID
ORDER BY created_at DESC
LIMIT 20;
```

### Query: Lihat semua notifikasi (tanpa filter user)

```sql
SELECT 
  n.id,
  u.name as user_name,
  n.type,
  n.title,
  n.message,
  n.is_read,
  n.created_at
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 50;
```

### Query: Lihat notifikasi yang belum dibaca

```sql
SELECT 
  id,
  type,
  title,
  created_at
FROM notifications
WHERE is_read = false
AND is_deleted = false
ORDER BY created_at DESC;
```

### Query: Lihat abandoned carts yang belum ada order

```sql
SELECT 
  ac.id,
  ac.customerName,
  ac.customerPhone,
  ac.formTitle,
  ac.timestamp,
  (SELECT COUNT(*) FROM orders WHERE customerPhone = ac.customerPhone AND formId = ac.formId) as has_order
FROM abandoned_carts ac
WHERE ac.status = 'New'
ORDER BY ac.timestamp DESC;
```

## 🔧 Troubleshooting

### Notifikasi tidak muncul saat order dibuat

**Kemungkinan:**
1. ✅ Trigger tidak terpasang → Run SQL triggers
2. ✅ CS Agent tidak ada / tidak aktif → Check users tabel status = 'Aktif'
3. ✅ Brand tidak ada di user → Check assignedBrandIds

**Cek SQL (copy-paste UUID yang benar):**
```sql
-- 1. Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_on_new_order';

-- 2. Check CS agent exists dan aktif
-- Ganti cs_id dengan UUID yang benar dari users table
SELECT id, name, role, status FROM users 
WHERE role = 'Customer service' 
AND status = 'Aktif' 
LIMIT 5;

-- 3. Check brand assignment untuk Advertiser
-- Ganti advertiser_id dengan UUID yang benar
SELECT id, name, "assignedBrandIds" FROM users 
WHERE role = 'Advertiser' 
AND status = 'Aktif'
LIMIT 5;

-- 4. Lihat semua triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trigger_notify%';
```

### Notifikasi tidak dihapus saat order submit

**Masalah:** Order dibuat tapi abandoned_cart masih ada

**Solusi:** Di FormViewerPage.tsx, pastikan ada:
```typescript
// Delete abandoned cart setelah order berhasil
const cartId = sessionStorage.getItem(`abandonedCart_${form.id}`);
if (cartId) {
  await supabase.from('abandoned_carts').delete().eq('id', cartId);
}
```

### Permissions Error saat trigger execute

**Masalah:** `permission denied for schema public`

**Solusi:** 
```sql
-- Jalankan sebagai postgres superuser di Supabase
-- Atau buat role dengan permissions:
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.notifications TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.abandoned_carts TO authenticated;
```

## 📝 Next Steps

1. ✅ Run SQL triggers di Supabase
2. ✅ Test order creation → check notifications
3. ✅ Test abandoned cart → check notifications
4. ✅ Monitor notification dropdown untuk lihat notifikasi real-time
5. ✅ Test notification bell badge updates (unread count)

## 📚 Related Files

- `scripts/notifications-schema.sql` - Tabel notifications schema
- `scripts/notifications-triggers.sql` - Triggers untuk auto-create notifications
- `services/notificationService.ts` - Service untuk query notifikasi
- `contexts/NotificationContext.tsx` - Context untuk state management
- `components/NotificationDropdown.tsx` - Dropdown UI
- `components/Header.tsx` - Bell icon di header

## 🎯 Summary

**Sebelum:** Notifikasi tidak tersimpan di database, hanya hardcoded
**Sesudah:** Notifikasi otomatis dibuat di database saat event terjadi:
- ✅ Order baru dibuat → notifikasi ORDER_NEW
- ✅ Cart ditinggalkan → notifikasi CART_ABANDON  
- ✅ Status berubah → notifikasi SYSTEM_ALERT

User bisa lihat notifikasi:
1. **Real-time** di notification dropdown (Header)
2. **Persisten** di halaman Notifikasi
3. **Unread count** badge di bell icon
