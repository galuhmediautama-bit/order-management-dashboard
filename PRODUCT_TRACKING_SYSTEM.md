# Product Tracking System Documentation

## Overview

Sistem parent product untuk mengelola 1 produk dengan multiple forms dari berbagai advertiser, dengan tracking performa per form dan per advertiser.

## Architecture

```
Products (Induk)
├─ Laptop Gaming (Brand: ElectronicsBrand)
│
└─ Forms (Child)
   ├─ Form "Laptop Gaming - Advertiser A"
   │  └─ Analytics: 1200 views, 45 orders, Rp 45M revenue
   │
   ├─ Form "Laptop Gaming - Advertiser B"
   │  └─ Analytics: 800 views, 32 orders, Rp 32M revenue
   │
   └─ Form "Laptop Gaming - TikTok Campaign"
      └─ Analytics: 2000 views, 78 orders, Rp 78M revenue
```

## Database Schema

### Products Table
```sql
products {
  id: UUID PRIMARY KEY
  brand_id: UUID FK -> users
  name: VARCHAR(255)
  description: TEXT
  image_url: VARCHAR(500)
  sku: VARCHAR(100)
  category: VARCHAR(100)
  
  -- Stock Management
  initial_stock: INTEGER
  stock_tracking: JSONB { enabled, current }
  
  -- Pricing
  base_price: DECIMAL
  cost_price: DECIMAL
  
  -- Status
  status: 'active' | 'inactive' | 'archived'
  is_featured: BOOLEAN
  
  -- SEO
  seo_title: VARCHAR(255)
  seo_description: VARCHAR(500)
  
  -- Metadata
  tags: JSONB []
  attributes: JSONB {}
  
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Product Form Analytics Table
```sql
product_form_analytics {
  id: UUID PRIMARY KEY
  product_id: UUID FK -> products
  form_id: UUID FK -> forms
  advertiser_id: UUID FK -> users
  
  -- Performance Metrics
  views_count: INTEGER
  clicks_count: INTEGER
  orders_count: INTEGER
  total_revenue: DECIMAL
  
  -- Engagement
  average_time_on_page: NUMERIC
  bounce_rate: NUMERIC
  
  -- Conversion (auto-calculated)
  conversion_rate: NUMERIC (%)
  average_order_value: DECIMAL
  
  -- Traffic Source
  traffic_sources: JSONB {
    organic: 0,
    social: 0,
    email: 0,
    paid: 0,
    direct: 0
  }
  top_referrer: VARCHAR(500)
  
  -- Period
  period_start: DATE
  period_end: DATE
  
  is_active: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Views (Analytics Aggregation)

#### `product_performance_aggregate`
```
product_id
product_name
brand_id
total_forms: COUNT(DISTINCT form_id)
total_advertisers: COUNT(DISTINCT advertiser_id)
total_views: SUM(views_count)
total_clicks: SUM(clicks_count)
total_orders: SUM(orders_count)
total_revenue: SUM(total_revenue)
conversion_rate_percent: (total_orders / total_views * 100)
avg_order_value: (total_revenue / total_orders)
last_updated: MAX(updated_at)
```

#### `advertiser_product_performance`
```
advertiser_id
product_id
product_name
forms_count: COUNT(DISTINCT form_id)
views_count
clicks_count
orders_count
total_revenue
conversion_rate
average_order_value
period_start
is_profitable: (total_revenue > 0)
```

## Changes to Existing Tables

### Forms Table
```sql
ALTER TABLE forms ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX idx_forms_product_id ON forms(product_id);
```

## RPC Functions

### `create_product_analytics()`
```typescript
create_product_analytics(
  p_product_id: UUID,
  p_form_id: UUID,
  p_advertiser_id: UUID,
  p_period_start: DATE = CURRENT_DATE
): ProductFormAnalytics
```
- Creates analytics record jika tidak ada
- Updates if exists untuk same product-form-advertiser-period

### `update_analytics_metrics()`
```typescript
update_analytics_metrics(
  p_analytics_id: UUID,
  p_views_count: INTEGER = NULL,
  p_clicks_count: INTEGER = NULL,
  p_orders_count: INTEGER = NULL,
  p_total_revenue: DECIMAL = NULL
): BOOLEAN
```
- Updates metrics dan auto-calculates conversion_rate dan average_order_value

## TypeScript Types

### Product
```typescript
interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  category?: string;
  initialStock?: number;
  stockTracking: { enabled: boolean; current: number };
  basePrice?: number;
  costPrice?: number;
  status: 'active' | 'inactive' | 'archived';
  isFeatured: boolean;
  tags: string[];
  attributes: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}
```

### ProductFormAnalytics
```typescript
interface ProductFormAnalytics {
  id: string;
  productId: string;
  formId: string;
  advertiserId: string;
  viewsCount: number;
  clicksCount: number;
  ordersCount: number;
  totalRevenue: number;
  averageTimeOnPage: number;
  bounceRate: number;
  conversionRate: number;
  averageOrderValue: number;
  trafficSources: TrafficSources;
  topReferrer?: string;
  periodStart: string;
  periodEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Service Methods (productService.ts)

### Product CRUD
```typescript
// Get all products untuk brand
getProductsByBrand(brandId: string): Promise<Product[]>

// Get single product
getProduct(productId: string): Promise<Product | null>

// Create product
createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>

// Update product
updateProduct(productId: string, updates: Partial<Product>): Promise<Product>

// Delete product (soft delete)
deleteProduct(productId: string): Promise<boolean>
```

### Analytics Management
```typescript
// Create/get analytics untuk form
createOrGetAnalytics(
  productId: string,
  formId: string,
  advertiserId: string
): Promise<ProductFormAnalytics>

// Update metrics
updateAnalyticsMetrics(
  analyticsId: string,
  metrics: { viewsCount?, clicksCount?, ordersCount?, totalRevenue? }
): Promise<boolean>

// Get analytics untuk form
getFormAnalytics(formId: string): Promise<ProductFormAnalytics | null>

// Get all analytics untuk product
getProductAnalytics(productId: string): Promise<ProductFormAnalytics[]>

// Get advertiser analytics
getAdvertiserProductAnalytics(advertiserId: string): Promise<ProductFormAnalytics[]>
```

### Aggregated Views
```typescript
// Get product aggregate performance
getProductPerformanceAggregate(productId: string): Promise<ProductPerformanceAggregate | null>

// Get all products performance untuk brand
getBrandProductsPerformance(brandId: string): Promise<ProductPerformanceAggregate[]>

// Get advertiser performance per product
getAdvertiserPerformancePerProduct(advertiserId: string): Promise<AdvertiserProductPerformance[]>

// Get top performing products
getTopProducts(brandId: string, limit?: number): Promise<ProductPerformanceAggregate[]>
```

### Form-Product Linking
```typescript
// Get forms linked to product
getProductForms(productId: string): Promise<any[]>

// Link form to product
linkFormToProduct(formId: string, productId: string): Promise<boolean>

// Unlink form from product
unlinkFormFromProduct(formId: string): Promise<boolean>
```

## Pages & Components

### ProductsPage (`pages/ProductsPage.tsx`)
- Kelola products induk
- Create, Read, Update, Delete (CRUD)
- Search functionality
- Product listing table
- Modal untuk edit/create

### ProductAnalyticsPage (`pages/ProductAnalyticsPage.tsx`)
- View 1: Product Performance Aggregate
  - KPI cards (Total Views, Orders, Revenue, Conversion Rate)
  - Bar chart: Revenue per Product
  - Line chart: Conversion Rate per Product
  - Table: Product details
  
- View 2: Advertiser Performance
  - Table: Advertiser performance per product
  - Profitability indicator
  - Period-based tracking

## Data Flow

### Workflow 1: Creating Form with Product
1. User navigates to FormEditorPage
2. Selects/creates a Product (productId)
3. Form is created with `product_id` FK
4. Analytics record auto-created on form publish
5. Metrics updated as orders come in

### Workflow 2: Tracking Performance
1. Order placed via form
2. Order includes form_id
3. Backend/webhook updates product_form_analytics:
   - viewsCount++
   - ordersCount++
   - totalRevenue += order.amount
4. Conversion_rate auto-calculated
5. Views aggregated to product_performance_aggregate

### Workflow 3: Multi-Advertiser Tracking
1. 3 advertisers create forms for same product
2. Each form has separate analytics record
3. Analytics table entries:
   - [Advertiser A, Form 1, Product 1] → 1200 views
   - [Advertiser B, Form 2, Product 1] → 800 views
   - [Advertiser C, Form 3, Product 1] → 2000 views
4. product_performance_aggregate sums:
   - Total views: 4000
   - Total forms: 3
   - Total advertisers: 3

## Use Cases

### Use Case 1: Brand Monitoring
- Brand owner dapat melihat total performa produk
- Compare performance across different advertisers
- Identify top performing advertising channels

### Use Case 2: Advertiser Analytics
- Advertiser dapat melihat ROI per product
- Track which product generates most revenue
- Optimize campaigns berdasarkan data

### Use Case 3: Product Optimization
- Identify underperforming products
- Compare pricing/cost across different forms
- Stock management per product

### Use Case 4: Commission Tracking
- Calculate commission berdasarkan:
  - Product default commission
  - Form-level commission override
  - Advertiser's specific rates
  - Order revenue

## Implementation Steps

### Step 1: Execute SQL Migrations
```bash
# Run in Supabase SQL Editor
supabase_products_table.sql
```

### Step 2: Install/Verify Dependencies
```bash
npm install recharts  # For charts in ProductAnalyticsPage
```

### Step 3: Add Pages to App.tsx
```typescript
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage'));
const ProductAnalyticsPage = lazyWithRetry(() => import('./pages/ProductAnalyticsPage'));

// In Routes:
<Route path="/produk" element={<ProductsPage />} />
<Route path="/analitik-produk" element={<ProductAnalyticsPage />} />
```

### Step 4: Add Navigation Items
Update Sidebar.tsx to include:
- Produk (Products management)
- Analitik Produk (Product analytics)

### Step 5: Update FormEditorPage
Add product selection dropdown in form settings

### Step 6: Setup Analytics Tracking
On order creation, call:
```typescript
const analytics = await productService.createOrGetAnalytics(
  form.productId,
  form.id,
  form.brandId
);

await productService.updateAnalyticsMetrics(analytics.id, {
  ordersCount: 1,
  totalRevenue: order.amount
});
```

## Security & RLS

### Proposed RLS Policies

#### Products Table
```sql
-- Brand can only see their own products
CREATE POLICY products_brand_policy ON products
FOR SELECT USING (brand_id = auth.uid());

CREATE POLICY products_brand_insert ON products
FOR INSERT WITH CHECK (brand_id = auth.uid());

CREATE POLICY products_brand_update ON products
FOR UPDATE USING (brand_id = auth.uid());
```

#### Product Form Analytics Table
```sql
-- Advertiser can see analytics for their forms
CREATE POLICY analytics_advertiser_policy ON product_form_analytics
FOR SELECT USING (advertiser_id = auth.uid());

-- Brand can see analytics for their products
CREATE POLICY analytics_brand_policy ON product_form_analytics
FOR SELECT USING (
  product_id IN (
    SELECT id FROM products WHERE brand_id = auth.uid()
  )
);
```

## Performance Optimization

### Indexes
- `idx_products_brand_id` - For brand queries
- `idx_products_status` - For filtering active products
- `idx_forms_product_id` - For form queries
- `idx_analytics_product_id` - For analytics queries
- `idx_analytics_advertiser_id` - For advertiser queries
- `idx_analytics_period` - For time-based queries

### Caching Strategy
- Cache product list per brand (5 min TTL)
- Cache analytics per form (1 min TTL)
- Cache aggregated views (5 min TTL)

### Query Optimization
- Use views untuk instant aggregations
- Pagination untuk large datasets
- Pre-calculate conversion_rate di database

## Future Enhancements

1. **Inventory Management**
   - Real-time stock tracking
   - Low stock alerts
   - Stock allocation per advertiser

2. **Advanced Analytics**
   - Cohort analysis
   - Funnel tracking
   - Attribution modeling

3. **Automation**
   - Auto-pause underperforming forms
   - Dynamic pricing based on performance
   - Commission auto-calculation

4. **Reporting**
   - PDF export
   - Scheduled reports
   - Email notifications

5. **Multi-currency Support**
   - Support multiple currencies
   - Real-time exchange rates
   - Regional analytics
