# Arsitektur Brand → Product → Form
**Date:** December 4, 2025  
**Version:** 1.0

## 📋 Ringkasan Logika Bisnis

### Prinsip Dasar
1. **Brand** adalah entitas utama - dibuat 1 kali, tidak boleh digandakan
2. **Produk Induk** dibuat 1 kali per produk - tidak tergantung jumlah advertiser
3. **Formulir** adalah penghubung antara advertiser dan produk induk
4. **Formulir BUKAN produk** - hanya mewarisi data dari produk induk

### Contoh Perhitungan
```
1 Brand
  ├─ 2 Produk Induk
  └─ 5 Advertiser

Total Formulir = 2 produk × 5 advertiser = 10 formulir
```

---

## 🗄️ Database Schema

### 1. Tabel `brands`
**Fungsi:** Master data merek/brand

```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Constraint:**
- `name` UNIQUE - mencegah duplikasi brand

---

### 2. Tabel `products`
**Fungsi:** Master data produk induk

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Identitas Produk
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    category VARCHAR(100),
    image_url TEXT,
    
    -- Pricing & Inventory (Master)
    base_price DECIMAL(15,2),
    compare_price DECIMAL(15,2),
    cost_price DECIMAL(15,2),
    weight DECIMAL(10,2),
    initial_stock INTEGER DEFAULT 0,
    
    -- Commission (Default untuk semua form)
    default_cs_commission DECIMAL(15,2) DEFAULT 0,
    default_adv_commission DECIMAL(15,2) DEFAULT 0,
    
    -- Variants (JSONB untuk fleksibilitas)
    variants JSONB DEFAULT '[]',
    variant_options JSONB DEFAULT '[]',
    
    -- SEO & Meta
    seo_title VARCHAR(255),
    seo_description TEXT,
    tags TEXT[],
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    is_featured BOOLEAN DEFAULT false,
    
    -- Tracking
    stock_tracking JSONB DEFAULT '{"enabled": false, "current": 0}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint
    UNIQUE(brand_id, sku)
);

-- Index untuk performa
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
```

**Constraint:**
- `brand_id` FOREIGN KEY → brands(id) CASCADE
- `UNIQUE(brand_id, sku)` - mencegah duplikasi SKU dalam 1 brand

---

### 3. Tabel `forms`
**Fungsi:** Formulir advertiser - penghubung antara advertiser dan produk

```sql
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relasi ke Produk Induk (WAJIB)
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Identitas Form
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    
    -- Advertiser Assignment
    advertiser_id UUID REFERENCES users(id) ON DELETE SET NULL,
    advertiser_name VARCHAR(255), -- Untuk tracking jika user dihapus
    
    -- Customization untuk Advertiser (Override dari product)
    custom_headline TEXT,
    custom_subheadline TEXT,
    custom_pricing JSONB, -- Override harga per variant
    custom_commission JSONB, -- Override komisi per variant
    
    -- Form Settings (Inherited + Custom)
    product_variants JSONB DEFAULT '[]', -- Inherited dari product.variants
    form_settings JSONB DEFAULT '{}', -- Custom settings (countdown, social proof, dll)
    shipping_settings JSONB DEFAULT '{}',
    payment_settings JSONB DEFAULT '{}',
    
    -- CS Assignment
    assigned_cs_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cs_assignment_mode VARCHAR(20) DEFAULT 'single',
    cs_round_robin_settings JSONB,
    
    -- Tracking & Analytics
    tracking_pixels JSONB DEFAULT '{}',
    thank_you_settings JSONB DEFAULT '{}',
    
    -- Performance Metrics (Auto-calculated)
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    
    -- Status & Visibility
    status VARCHAR(20) DEFAULT 'draft',
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint
    CONSTRAINT fk_form_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_form_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX idx_forms_product_id ON forms(product_id);
CREATE INDEX idx_forms_brand_id ON forms(brand_id);
CREATE INDEX idx_forms_advertiser_id ON forms(advertiser_id);
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_is_deleted ON forms(is_deleted);
```

**Constraint:**
- `product_id` FOREIGN KEY → products(id) CASCADE (WAJIB)
- `brand_id` FOREIGN KEY → brands(id) CASCADE (WAJIB)
- `slug` UNIQUE - untuk URL form
- `advertiser_id` FOREIGN KEY → users(id) SET NULL (opsional)

---

### 4. Tabel `orders`
**Fungsi:** Pesanan yang dibuat melalui formulir

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relasi
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE SET NULL,
    
    -- Customer Info
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    customer_address TEXT,
    
    -- Order Details
    product_variant_name VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    
    -- Commission Snapshot (Dari form saat order dibuat)
    cs_commission DECIMAL(15,2) DEFAULT 0,
    adv_commission DECIMAL(15,2) DEFAULT 0,
    
    -- Assignment
    assigned_cs_id UUID REFERENCES users(id) ON DELETE SET NULL,
    advertiser_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Shipping & Payment
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    payment_method VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'Pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_orders_form_id ON orders(form_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_brand_id ON orders(brand_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

---

## 🔗 Relasi Antar Entitas

```
┌─────────────────────────────────────────────────────────────────┐
│                         BRAND (Master)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • id                                                      │   │
│  │ • name (UNIQUE)                                          │   │
│  │ • description                                            │   │
│  │ • logo_url                                               │   │
│  │ • status                                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:N (One Brand → Many Products)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTS (Produk Induk)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • id                                                      │   │
│  │ • brand_id (FK → brands.id)                              │   │
│  │ • name                                                   │   │
│  │ • description                                            │   │
│  │ • sku (UNIQUE per brand)                                 │   │
│  │ • base_price                                             │   │
│  │ • variants (JSONB)                                       │   │
│  │ • default_cs_commission                                  │   │
│  │ • default_adv_commission                                 │   │
│  │ • status                                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:N (One Product → Many Forms)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                FORMS (Formulir per Advertiser)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • id                                                      │   │
│  │ • product_id (FK → products.id) [WAJIB]                  │   │
│  │ • brand_id (FK → brands.id) [WAJIB]                      │   │
│  │ • advertiser_id (FK → users.id) [OPSIONAL]               │   │
│  │ • title                                                  │   │
│  │ • slug (UNIQUE)                                          │   │
│  │ • product_variants (Inherited dari product)              │   │
│  │ • custom_headline                                        │   │
│  │ • custom_pricing (Override)                              │   │
│  │ • custom_commission (Override)                           │   │
│  │ • form_settings (Countdown, social proof, dll)           │   │
│  │ • total_views, total_orders, total_revenue               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 1:N (One Form → Many Orders)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ORDERS                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • id                                                      │   │
│  │ • form_id (FK → forms.id)                                │   │
│  │ • product_id (FK → products.id)                          │   │
│  │ • brand_id (FK → brands.id)                              │   │
│  │ • customer_name, customer_phone                          │   │
│  │ • product_variant_name                                   │   │
│  │ • quantity, unit_price, total_price                      │   │
│  │ • cs_commission (Snapshot)                               │   │
│  │ • adv_commission (Snapshot)                              │   │
│  │ • status                                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Contoh Data Model (JSON)

### Brand
```json
{
  "id": "brand-001",
  "name": "Alibata",
  "description": "Premium beauty products",
  "logo_url": "https://...",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Product (Produk Induk)
```json
{
  "id": "product-001",
  "brand_id": "brand-001",
  "name": "Serum Wajah Premium",
  "description": "Serum wajah dengan vitamin C",
  "sku": "SRM-001",
  "category": "Skincare",
  "base_price": 150000,
  "compare_price": 200000,
  "cost_price": 80000,
  "default_cs_commission": 10000,
  "default_adv_commission": 15000,
  "variants": [
    {
      "id": "var-001",
      "name": "15ml",
      "sku": "SRM-001-15ML",
      "price": 150000,
      "comparePrice": 200000,
      "csCommission": 10000,
      "advCommission": 15000,
      "weight": 50,
      "stock": 100
    },
    {
      "id": "var-002",
      "name": "30ml",
      "sku": "SRM-001-30ML",
      "price": 250000,
      "comparePrice": 350000,
      "csCommission": 20000,
      "advCommission": 25000,
      "weight": 80,
      "stock": 50
    }
  ],
  "status": "active"
}
```

### Form (Formulir Advertiser)
```json
{
  "id": "form-001",
  "product_id": "product-001",
  "brand_id": "brand-001",
  "advertiser_id": "adv-001",
  "advertiser_name": "John Advertiser",
  "title": "Serum Wajah Premium - Promo Spesial",
  "slug": "serum-wajah-promo-john",
  "custom_headline": "DISKON 50% HARI INI SAJA!",
  "custom_subheadline": "Dapatkan kulit glowing dalam 7 hari",
  
  "product_variants": [
    {
      "id": "var-001",
      "name": "15ml",
      "price": 150000,
      "comparePrice": 200000,
      "csCommission": 10000,
      "advCommission": 15000
    },
    {
      "id": "var-002",
      "name": "30ml",
      "price": 250000,
      "comparePrice": 350000,
      "csCommission": 20000,
      "advCommission": 25000
    }
  ],
  
  "form_settings": {
    "countdown": {
      "enabled": true,
      "duration": 600
    },
    "socialProof": {
      "enabled": true,
      "messages": ["3 orang baru saja membeli!"]
    }
  },
  
  "total_views": 1500,
  "total_clicks": 300,
  "total_orders": 45,
  "total_revenue": 6750000,
  "status": "published"
}
```

### Order
```json
{
  "id": "order-001",
  "form_id": "form-001",
  "product_id": "product-001",
  "brand_id": "brand-001",
  "advertiser_id": "adv-001",
  "customer_name": "Jane Customer",
  "customer_phone": "081234567890",
  "product_variant_name": "15ml",
  "quantity": 2,
  "unit_price": 150000,
  "total_price": 300000,
  "cs_commission": 10000,
  "adv_commission": 15000,
  "assigned_cs_id": "cs-001",
  "status": "Shipped",
  "created_at": "2025-12-01T10:00:00Z"
}
```

---

## 🔄 Data Flow & Inheritance

### 1. Saat Membuat Form Baru
```
PRODUCT (Master Data)
  ├─ variants: [var-001, var-002]
  ├─ base_price: 150000
  └─ default_cs_commission: 10000
           │
           │ INHERITANCE (Copy to Form)
           ▼
FORM (Instance untuk Advertiser)
  ├─ product_variants: [var-001, var-002] ← INHERITED
  ├─ custom_headline: "DISKON 50%!" ← CUSTOM
  └─ custom_pricing: {...} ← OPTIONAL OVERRIDE
```

**Proses:**
1. User pilih Product Induk di Form Editor
2. System fetch `product.variants` dari database
3. System copy variants ke `form.product_variants`
4. Advertiser bisa customize headline, countdown, dll
5. Advertiser TIDAK bisa ubah data master product

---

### 2. Saat Order Dibuat
```
FORM
  ├─ product_variants[0].csCommission: 10000
  └─ product_variants[0].advCommission: 15000
           │
           │ SNAPSHOT (Save ke Order)
           ▼
ORDER
  ├─ cs_commission: 10000 ← SNAPSHOT
  └─ adv_commission: 15000 ← SNAPSHOT
```

**Proses:**
1. Customer pilih variant di form
2. System ambil harga + komisi dari `form.product_variants`
3. System save snapshot ke `order.cs_commission` dan `order.adv_commission`
4. Jika form/product berubah, order tetap pakai snapshot lama

---

## 📈 Query Examples

### 1. Get All Forms for a Product
```sql
SELECT 
    f.id,
    f.title,
    f.advertiser_name,
    f.total_orders,
    f.total_revenue,
    p.name as product_name,
    b.name as brand_name
FROM forms f
JOIN products p ON f.product_id = p.id
JOIN brands b ON f.brand_id = b.id
WHERE f.product_id = 'product-001'
  AND f.is_deleted = false
ORDER BY f.total_revenue DESC;
```

### 2. Count Forms per Product
```sql
SELECT 
    p.id,
    p.name,
    COUNT(f.id) as total_forms,
    COUNT(DISTINCT f.advertiser_id) as unique_advertisers
FROM products p
LEFT JOIN forms f ON f.product_id = p.id AND f.is_deleted = false
WHERE p.brand_id = 'brand-001'
GROUP BY p.id, p.name
ORDER BY total_forms DESC;
```

### 3. Product Performance Aggregate
```sql
SELECT 
    p.id,
    p.name,
    COUNT(DISTINCT f.id) as total_forms,
    SUM(f.total_views) as aggregate_views,
    SUM(f.total_orders) as aggregate_orders,
    SUM(f.total_revenue) as aggregate_revenue,
    ROUND(AVG(f.total_orders::FLOAT / NULLIF(f.total_views, 0) * 100), 2) as avg_conversion_rate
FROM products p
LEFT JOIN forms f ON f.product_id = p.id AND f.is_deleted = false
WHERE p.brand_id = 'brand-001'
GROUP BY p.id, p.name
ORDER BY aggregate_revenue DESC;
```

### 4. Advertiser Performance per Product
```sql
SELECT 
    f.advertiser_id,
    f.advertiser_name,
    p.name as product_name,
    f.total_views,
    f.total_orders,
    f.total_revenue,
    ROUND(f.total_orders::FLOAT / NULLIF(f.total_views, 0) * 100, 2) as conversion_rate
FROM forms f
JOIN products p ON f.product_id = p.id
WHERE p.id = 'product-001'
  AND f.is_deleted = false
ORDER BY f.total_revenue DESC;
```

---

## ✅ Validation Rules

### Product Creation
```typescript
// Product HARUS memiliki brand_id
if (!product.brand_id) {
  throw new Error('Brand harus dipilih');
}

// SKU harus unique per brand
const existingSKU = await checkSKU(product.brand_id, product.sku);
if (existingSKU) {
  throw new Error('SKU sudah digunakan untuk brand ini');
}
```

### Form Creation
```typescript
// Form HARUS memiliki product_id dan brand_id
if (!form.product_id) {
  throw new Error('Produk Induk harus dipilih');
}

if (!form.brand_id) {
  throw new Error('Brand harus dipilih');
}

// Validasi product dan brand konsisten
const product = await getProduct(form.product_id);
if (product.brand_id !== form.brand_id) {
  throw new Error('Brand form tidak sesuai dengan brand produk');
}

// Slug harus unique
const existingSlug = await checkSlug(form.slug);
if (existingSlug) {
  throw new Error('Slug sudah digunakan');
}
```

### Order Creation
```typescript
// Order HARUS memiliki form_id, product_id, brand_id
if (!order.form_id || !order.product_id || !order.brand_id) {
  throw new Error('Order harus terkait dengan form dan product');
}

// Save commission snapshot
const form = await getForm(order.form_id);
const variant = form.product_variants.find(v => v.id === selectedVariantId);
order.cs_commission = variant.csCommission;
order.adv_commission = variant.advCommission;
```

---

## 🎯 Key Principles

### ✅ DO's
1. **Brand dibuat 1 kali** - tidak boleh duplikat
2. **Product dibuat 1 kali** - tidak tergantung jumlah advertiser
3. **Form mewarisi data dari Product** - via `product_variants`
4. **Form bisa customize** - headline, pricing override, settings
5. **Order menyimpan snapshot** - commission tidak berubah jika form/product berubah
6. **1 Advertiser = 1 Form per Product** - untuk tracking terpisah

### ❌ DON'Ts
1. **Jangan duplikat Product** untuk setiap advertiser
2. **Jangan ubah Product master data** dari Form
3. **Jangan hitung Form sebagai Product** - form hanya instance/turunan
4. **Jangan buat relasi Advertiser langsung ke Product** - harus via Form

---

## 📦 Implementation Checklist

- [x] Database schema dengan foreign keys
- [x] Index untuk query performance
- [x] Validation rules di application layer
- [x] Data inheritance mechanism (Product → Form)
- [x] Snapshot mechanism (Form → Order)
- [x] Query examples untuk analytics
- [x] JSON data model examples

---

## 🔍 Summary

**Relasi:**
```
Brand (1) → (N) Products (1) → (N) Forms (1) → (N) Orders
```

**Key Points:**
- Brand = Master entity (unique)
- Product = Master product data (unique per brand)
- Form = Advertiser instance (inherits from product, customizable)
- Order = Transaction record (snapshot of form data)

**Formula:**
```
Total Forms = Σ(Products per Brand) × Σ(Advertisers)
```

**Contoh:**
- 1 Brand × 2 Products × 5 Advertisers = **10 Forms**
- Forms ≠ Products
- Forms = Access points untuk advertisers

---

**End of Document**
