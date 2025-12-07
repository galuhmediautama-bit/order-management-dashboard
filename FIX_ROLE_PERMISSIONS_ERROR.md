# 🔧 FIX: Column settings.role_permissions does not exist

## Masalah
Error: `column settings.role_permissions does not exist`

## Penyebab
Tabel `settings` belum dibuat di database Supabase atau kolom `role_permissions` tidak ada.

## Solusi - Jalankan SQL Script

### Langkah 1: Buka Supabase SQL Editor
1. Login ke Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik tombol **New Query**

### Langkah 2: Copy & Paste SQL Script
Copy semua isi file `SETUP_ROLE_PERMISSIONS_TABLE.sql` atau copy script di bawah:

```sql
-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    role_permissions JSONB,
    website_settings JSONB,
    tracking_settings JSONB,
    message_templates JSONB,
    cancellation_reasons JSONB,
    announcement_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow all authenticated users to read settings" ON public.settings;
DROP POLICY IF EXISTS "Only Super Admin can modify settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.settings;
DROP POLICY IF EXISTS "Allow Super Admin write" ON public.settings;

-- Create new policies
CREATE POLICY "Allow authenticated read" ON public.settings
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow Super Admin write" ON public.settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
        AND (role = 'Super Admin' OR role = 'Admin')
    )
);

-- Insert default permissions
INSERT INTO public.settings (id, role_permissions, updated_at)
VALUES (
    'rolePermissions',
    '{
        "Super Admin": {
            "menus": ["dashboard", "products", "product_list", "form_list", "orders", "order_list", "abandoned_carts", "customers", "reports", "ad_reports", "cs_reports", "earnings", "settings", "website_settings", "user_management", "role_management", "brands", "cs_management", "tracking", "announcements", "deletion_requests", "cuan_rank"],
            "features": ["export_csv", "edit_form", "delete_order", "change_order_status", "view_earnings", "manage_users", "manage_roles", "view_reports", "edit_settings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_charts", "view_top_products", "view_top_advertisers", "view_top_cs", "view_recent_orders"]
        },
        "Admin": {
            "menus": ["dashboard", "products", "product_list", "form_list", "orders", "order_list", "abandoned_carts", "customers", "reports", "ad_reports", "cs_reports", "earnings", "settings", "website_settings", "user_management", "brands", "cs_management", "tracking", "announcements"],
            "features": ["export_csv", "edit_form", "delete_order", "change_order_status", "view_earnings", "manage_users", "view_reports", "edit_settings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_charts", "view_top_products", "view_top_advertisers", "view_top_cs", "view_recent_orders"]
        },
        "Keuangan": {
            "menus": ["dashboard", "orders", "order_list", "customers", "reports", "cs_reports", "earnings"],
            "features": ["export_csv", "view_earnings", "view_reports", "view_sales_stats", "view_charts", "view_top_cs", "view_recent_orders"]
        },
        "Customer service": {
            "menus": ["dashboard", "orders", "order_list", "abandoned_carts", "customers", "earnings"],
            "features": ["export_csv", "change_order_status", "view_earnings", "sound_notifications", "manual_order_creation", "view_sales_stats", "view_recent_orders"]
        },
        "Gudang": {
            "menus": ["dashboard", "orders", "order_list"],
            "features": ["change_order_status", "sound_notifications", "view_recent_orders"]
        },
        "Advertiser": {
            "menus": ["dashboard", "products", "product_list", "form_list", "reports", "ad_reports", "earnings"],
            "features": ["export_csv", "edit_form", "view_earnings", "sound_notifications", "view_sales_stats", "view_charts", "view_top_products"]
        },
        "Partner": {
            "menus": ["dashboard", "reports", "ad_reports"],
            "features": ["view_reports", "view_sales_stats", "view_charts"]
        }
    }'::jsonb,
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role_permissions = EXCLUDED.role_permissions,
    updated_at = NOW();
```

### Langkah 3: Run Query
1. Klik tombol **Run** atau tekan `Ctrl + Enter`
2. Tunggu sampai selesai (biasanya < 1 detik)
3. Cek output - harusnya sukses tanpa error

### Langkah 4: Verifikasi
Jalankan query ini untuk verifikasi:

```sql
SELECT * FROM public.settings WHERE id = 'rolePermissions';
```

Harusnya muncul 1 row dengan data role_permissions.

### Langkah 5: Test di Dashboard
1. Refresh halaman dashboard Anda (F5)
2. Buka **Pengaturan** → **Manajemen Peran**
3. Klik **Kelola Menu & Fitur** pada role Advertiser
4. Centang "Daftar Produk" dan "Daftar Formulir"
5. Klik **Simpan Izin**
6. Harusnya muncul toast sukses tanpa error

### Langkah 6: Test Login Advertiser
1. Login sebagai user dengan role Advertiser
2. Cek sidebar - harusnya muncul menu:
   - 📊 Dasbor
   - 📦 Produk
     - Daftar Produk ✅
     - Daftar Formulir ✅
   - 📈 Laporan
     - Laporan Iklan
   - 💰 Penghasilan

## Troubleshooting

### Jika masih error "does not exist"
1. Cek apakah tabel settings ada:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'settings';
   ```

2. Cek kolom yang ada di tabel settings:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'settings' AND table_schema = 'public';
   ```

3. Jika kolom `role_permissions` tidak ada, tambahkan manual:
   ```sql
   ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS role_permissions JSONB;
   ```

### Jika RLS Policy error
```sql
-- Drop semua policies lama
DROP POLICY IF EXISTS "Allow all authenticated users to read settings" ON public.settings;
DROP POLICY IF EXISTS "Only Super Admin can modify settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.settings;
DROP POLICY IF EXISTS "Allow Super Admin write" ON public.settings;

-- Buat ulang
CREATE POLICY "Allow authenticated read" ON public.settings
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow Super Admin write" ON public.settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
        AND (role = 'Super Admin' OR role = 'Admin')
    )
);
```

## Selesai! ✅
Setelah menjalankan SQL script, sistem role permissions akan berfungsi dengan baik.
