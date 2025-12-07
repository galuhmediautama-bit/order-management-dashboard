# Setup Notifications System

## Database Setup

Notifikasi sistem ini memerlukan tabel `notifications` di Supabase.

### 1. Buat Tabel Notifications

Jalankan SQL script berikut di **Supabase SQL Editor**:

```sql
-- Jalankan file: CREATE_NOTIFICATIONS_TABLE.sql
```

Atau copy-paste isi file `CREATE_NOTIFICATIONS_TABLE.sql` ke SQL Editor dan execute.

### 2. Cara Kerja Sistem Notifikasi

#### A. **Saat Pertama Kali Load**
- Header akan check apakah tabel `notifications` kosong
- Jika kosong, akan auto-generate notifikasi dari:
  - 📦 Orders terbaru (7 hari terakhir)
  - 🛒 Abandoned carts terbaru (7 hari terakhir)
- Notifikasi disimpan ke database untuk referensi

#### B. **Real-time Updates**
Sistem listen 3 tabel dengan Supabase Realtime:

1. **`orders` table** (INSERT)
   - Pesanan baru masuk → Auto insert ke notifications
   - Toast notification + sound
   
2. **`orders` table** (UPDATE status)
   - Status berubah → Insert status change notification
   - Contoh: Processing, Shipped, Delivered, Canceled

3. **`abandoned_carts` table** (INSERT)
   - Keranjang baru ditinggalkan → Auto insert ke notifications
   - Toast notification + sound

#### C. **Display di Header**
- Bell icon menampilkan badge count
- Dropdown menampilkan 20 notifikasi terbaru
- Color coding berdasarkan tipe:
  - 📦 Pesanan baru (indigo)
  - 🛒 Abandoned cart (amber)
  - 📝 Status change (purple)
  - 👤 User signup (green)
  - 🚚 Shipped (blue)

### 3. Troubleshooting

#### Notifikasi Tidak Muncul?

1. **Check tabel notifications exists:**
   ```sql
   SELECT * FROM notifications LIMIT 1;
   ```

2. **Check Realtime enabled di Supabase:**
   - Database → Replication → Enable untuk tabel `orders`, `abandoned_carts`, `notifications`

3. **Check browser console:**
   ```
   [Real-time] Subscription status: SUBSCRIBED ✅
   [Real-time] New order detected: {...}
   ```

4. **Manual insert test:**
   ```sql
   INSERT INTO notifications (id, type, message, read, timestamp, "userId")
   VALUES (
     'test-123',
     'new_order',
     '📦 Test order notification',
     false,
     NOW(),
     'your-user-id'
   );
   ```

5. **Clear notifications dan regenerate:**
   ```sql
   DELETE FROM notifications;
   -- Refresh browser untuk auto-generate ulang
   ```

### 4. Fitur Tambahan

#### A. Tandai Semua Sebagai Dibaca
Button "Tandai semua" akan:
- Update `read = true` untuk semua notifications
- Reset localStorage counters (orders, carts)
- Refresh page untuk reset badge

#### B. Hapus Notifikasi (di NotificationsPage)
- Hapus individual notification
- Hapus semua notifikasi sekaligus

#### C. Auto-cleanup
Notifikasi lama (>30 hari) bisa di-cleanup dengan cron job:
```sql
DELETE FROM notifications 
WHERE timestamp < NOW() - INTERVAL '30 days';
```

### 5. Supabase Realtime Configuration

Pastikan Realtime enabled untuk tabel berikut:

**Database → Replication → Tables:**
- ✅ `orders` (INSERT, UPDATE)
- ✅ `abandoned_carts` (INSERT)
- ✅ `notifications` (INSERT, UPDATE)

**Realtime akan otomatis sync changes ke semua client yang aktif.**

---

## Testing Checklist

- [ ] Tabel `notifications` sudah dibuat
- [ ] RLS policies aktif
- [ ] Realtime enabled untuk 3 tabel
- [ ] Buka Header dropdown → Ada notifikasi lama (7 hari)
- [ ] Buat order baru → Muncul toast + notification di dropdown
- [ ] Update status order → Muncul notification status change
- [ ] Abandoned cart baru → Muncul notification
- [ ] Badge counter sesuai jumlah unread
- [ ] "Tandai semua" berfungsi

---

**Status:** ✅ Ready untuk production
**Last Updated:** December 7, 2025
