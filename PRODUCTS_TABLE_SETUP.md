# Setup Products Table - PENTING!

Jika Anda mendapatkan error "Gagal menyimpan produk" saat mencoba menambah produk, ikuti langkah ini:

## Step 1: Buka Supabase SQL Editor

1. Login ke Supabase Dashboard: https://supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **"New query"**

## Step 2: Copy dan jalankan SQL berikut

Salin **SEMUA** kode di bawah ini ke SQL Editor, kemudian klik **"Run"**:

```sql
-- Create Products table (parent/induk produk)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    category VARCHAR(100),
    
    -- Pricing (default/base price)
    base_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    attributes JSONB DEFAULT '{}',
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT products_name_brand_unique UNIQUE(name, brand_id)
);

-- Create index untuk faster queries
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Trigger untuk auto-update product updated_at
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_updated_at ON products;
CREATE TRIGGER trigger_update_product_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_updated_at();

-- Grant permissions
GRANT SELECT ON products TO authenticated;
GRANT INSERT, UPDATE ON products TO authenticated;
```

## Step 3: Verifikasi Berhasil

Setelah SQL selesai dijalankan, Anda akan melihat pesan "Success. No rows returned".

Klik **Table Editor** di sidebar dan pastikan tabel `products` sudah ada.

## Step 4: Coba Simpan Produk Lagi

Kembali ke aplikasi dan coba tambah produk baru. Sekarang seharusnya berhasil!

---

## Troubleshooting

### Error: "column "users" does not exist"
- Pastikan tabel `users` sudah ada di database
- Buka users table di Table Editor untuk memastikan ada

### Error: "permission denied"
- Pastikan user Anda memiliki role `authenticated` di Supabase
- RLS (Row Level Security) harus allow SELECT, INSERT, UPDATE untuk authenticated users

### Error: "relation "products" does not exist"
- Jalankan SQL di atas untuk membuat table

---

Jika masih ada masalah, screenshot error message dan berikan info:
1. Error message lengkap dari console browser (F12 → Console)
2. Nama brand yang dipilih
3. Nama produk yang dicoba ditambahkan
