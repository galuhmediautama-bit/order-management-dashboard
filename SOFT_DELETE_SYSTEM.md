# Sistem Soft Delete & Auto-Delete Order

## Overview
Sistem penghapusan pesanan dengan review approval dan auto-delete setelah 7 hari.

## Alur Proses

### 1. Request Deletion (Semua User)
- User (Admin/CS/Advertiser) meminta hapus pesanan
- Pesanan masuk ke **Permintaan Hapus** dengan status `pending`
- Pesanan masih terlihat di daftar pesanan sampai di-approve

### 2. Super Admin Approval
**Jika Approved:**
- Pesanan di-soft delete (tidak terlihat di daftar pesanan)
- Field `deletedAt` diisi dengan timestamp sekarang
- Field `scheduledDeletionDate` diisi dengan timestamp +7 hari
- Status di `pending_deletions` menjadi `approved`
- Toast notification: "Pesanan akan dihapus permanen dalam 7 hari"

**Jika Rejected:**
- Pesanan dikembalikan ke daftar pesanan normal
- Field `deletedAt` dan `scheduledDeletionDate` di-set null
- Status di `pending_deletions` menjadi `rejected`
- Toast notification: "Pesanan dikembalikan ke daftar pesanan"

### 3. Auto-Delete (After 7 Days)
- Cron job berjalan setiap hari (2 AM)
- Hapus permanent semua pesanan dengan `scheduledDeletionDate < NOW()`
- Data dihapus dari database secara permanen

## Database Schema

### Orders Table - New Columns
```sql
deletedAt TIMESTAMPTZ              -- Soft delete timestamp
scheduledDeletionDate TIMESTAMPTZ  -- Auto-delete scheduled date
```

### Pending Deletions Table
```sql
id UUID PRIMARY KEY
orderId UUID                       -- Reference to orders.id
orderNumber TEXT                   -- Short ID for display
customerName TEXT
totalPrice NUMERIC
requestedBy TEXT                   -- Email of requester
requestedAt TIMESTAMPTZ
status TEXT                        -- pending | approved | rejected
approvedBy TEXT
approvedAt TIMESTAMPTZ
rejectedBy TEXT
rejectedAt TIMESTAMPTZ
rejectionReason TEXT
```

## SQL Files

1. **supabase_add_soft_delete_columns.sql**
   - Menambahkan kolom `deletedAt` dan `scheduledDeletionDate` ke tabel orders
   - Run sekali untuk migrasi database

2. **supabase_auto_delete_expired_orders.sql**
   - Function untuk auto-delete expired orders
   - Setup pg_cron job untuk scheduling
   - Query untuk monitoring scheduled deletions

## Implementation Files

### PendingDeletionsPage.tsx
- `executeApproval()`: Soft delete + set scheduled date
- `executeRejection()`: Restore order (set deletedAt=null)
- Professional modal dengan info 7-hari
- Toast notifications

### OrdersPage.tsx
- Filter query: `.is('deletedAt', null)` - exclude soft-deleted
- Create deletion request untuk semua user
- Badge notification untuk pending deletions count

### types.ts
- Added `deletedAt?: string`
- Added `scheduledDeletionDate?: string`

## Setup Cron Job

### Option 1: Supabase pg_cron (Recommended)
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily job at 2 AM
SELECT cron.schedule(
    'auto-delete-expired-orders',
    '0 2 * * *',
    $$SELECT auto_delete_expired_orders()$$
);
```

### Option 2: External Cron + API
- Setup cron di server (GitHub Actions, DigitalOcean, dll)
- Call Supabase Edge Function atau REST API
- Run SQL function via API

### Option 3: Manual
```sql
-- Run manually when needed
SELECT auto_delete_expired_orders();
```

## Monitoring

### Check Scheduled Deletions
```sql
SELECT 
    id,
    "orderNumber",
    customer,
    "totalPrice",
    "deletedAt",
    "scheduledDeletionDate",
    EXTRACT(DAY FROM ("scheduledDeletionDate" - NOW())) as days_until_deletion
FROM orders
WHERE "scheduledDeletionDate" IS NOT NULL
ORDER BY "scheduledDeletionDate" ASC;
```

### Check Pending Deletion Requests
```sql
SELECT * FROM pending_deletions
WHERE status = 'pending'
ORDER BY "requestedAt" DESC;
```

## User Experience

### Request Delete
1. User click tombol hapus di OrdersPage
2. Professional modal konfirmasi muncul
3. Pesanan masuk ke pending_deletions dengan status `pending`
4. Toast: "Permintaan hapus dibuat. Menunggu review di Permintaan Hapus"

### Super Admin Approve
1. Super Admin buka halaman Permintaan Hapus
2. Click tombol "Approve" di pesanan
3. Modal muncul dengan info: "Pesanan akan dihapus permanen dalam 7 hari"
4. After confirm:
   - Pesanan hilang dari daftar pesanan
   - Toast: "Pesanan akan dihapus permanen dalam 7 hari"

### Super Admin Reject
1. Super Admin buka halaman Permintaan Hapus
2. Click tombol "Reject" di pesanan
3. Modal muncul dengan textarea untuk alasan penolakan
4. After confirm:
   - Pesanan kembali ke daftar pesanan
   - Toast: "Pesanan dikembalikan ke daftar pesanan"

## Benefits

✅ **Safety**: 7-day grace period untuk recovery
✅ **Transparency**: Semua deletion requests tercatat
✅ **Control**: Super Admin approval required
✅ **Clean UI**: Professional modals + toast notifications
✅ **Automation**: Auto-cleanup setelah 7 hari
✅ **Audit Trail**: requestedBy, approvedBy, rejectedBy tracking

## Notes

- Soft-deleted orders tidak terlihat di daftar pesanan
- Soft-deleted orders masih bisa di-query dengan filter `deletedAt IS NOT NULL`
- Rejected orders langsung restore (deletedAt=null)
- Auto-delete permanent setelah 7 hari dari approval
- Cron job harus di-setup untuk auto-delete functionality
