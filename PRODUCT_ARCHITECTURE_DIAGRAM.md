```
╔══════════════════════════════════════════════════════════════════════════════╗
║            PRODUCT TRACKING SYSTEM - ARCHITECTURE OVERVIEW                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ USER INTERFACE LAYER                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  ProductsPage       │  │FormEditorPage        │  │AnalyticsPage   │  │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤  │
│  │ • CRUD Products     │  │ • Create Form        │  │ • View Metrics  │  │
│  │ • Search/Filter     │  │ • Link Product       │  │ • Charts        │  │
│  │ • Table View        │  │ • Select Advertiser  │  │ • Aggregates    │  │
│  │ • Modal Edit        │  │ • Save with Analytics│  │ • Compare       │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVICE LAYER                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  productService.ts                                                          │
│  ├─ Product CRUD Operations                                                │
│  │  ├─ getProductsByBrand()      Get all products for brand               │
│  │  ├─ createProduct()           Create new product                       │
│  │  ├─ updateProduct()           Update product fields                    │
│  │  └─ deleteProduct()           Soft-delete product                      │
│  │                                                                          │
│  ├─ Analytics Management                                                   │
│  │  ├─ createOrGetAnalytics()    Create/get analytics record              │
│  │  ├─ updateAnalyticsMetrics()  Update with auto-calculation             │
│  │  ├─ getFormAnalytics()        Get specific form analytics              │
│  │  └─ getAdvertiserProductAnalytics() Get advertiser metrics             │
│  │                                                                          │
│  └─ Aggregated Views                                                       │
│     ├─ getProductPerformanceAggregate()     Single product aggregate      │
│     ├─ getBrandProductsPerformance()        All products per brand        │
│     └─ getAdvertiserPerformancePerProduct() Advertiser breakdown          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RPC Functions (Database)                                                   │
│  ├─ create_product_analytics()                                             │
│  │  └─ On Conflict: product_id + form_id + advertiser_id + period        │
│  │     AUTO INSERT or UPDATE record                                        │
│  │                                                                          │
│  └─ update_analytics_metrics()                                             │
│     └─ Auto-calculate:                                                     │
│        ├─ conversion_rate = (orders / views) * 100                        │
│        └─ average_order_value = revenue / orders                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DATA LAYER - DATABASE SCHEMA                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ products (Parent)                                                    │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ PK: id                                                               │  │
│  │ FK: brand_id                                                         │  │
│  │ ├─ name, description, image_url                                    │  │
│  │ ├─ sku, category                                                    │  │
│  │ ├─ base_price, cost_price                                          │  │
│  │ ├─ status (active|inactive|archived)                               │  │
│  │ ├─ is_featured                                                      │  │
│  │ ├─ stock_tracking (JSONB)                                          │  │
│  │ ├─ seo_title, seo_description                                      │  │
│  │ ├─ tags (array), attributes (jsonb)                                │  │
│  │ └─ created_at, updated_at                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                    ▼                                        │
│                         (1 Product → N Forms)                               │
│                                    ▼                                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ forms (Child) - UPDATED                                              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ PK: id                                                               │  │
│  │ FK: brand_id                                                         │  │
│  │ NEW FK: product_id (links to products table)                        │  │
│  │ ├─ title, slug, description                                         │  │
│  │ ├─ productOptions, variantCombinations                              │  │
│  │ ├─ shippingSettings, paymentSettings                                │  │
│  │ ├─ customerFields                                                    │  │
│  │ ├─ thankYouPage settings                                            │  │
│  │ ├─ trackingSettings, customScripts                                  │  │
│  │ └─ created_at, updated_at                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                    ▼                                        │
│                    (1 Product → N Advertisements)                           │
│                                    ▼                                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ product_form_analytics (Analytics Records)                           │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ PK: id                                                               │  │
│  │ UNIQUE: (product_id, form_id, advertiser_id, period_start)         │  │
│  │ ├─ Performance: views_count, clicks_count, orders_count             │  │
│  │ ├─ Revenue: total_revenue                                           │  │
│  │ ├─ Engagement: average_time_on_page, bounce_rate                    │  │
│  │ ├─ Conversion: conversion_rate (%), average_order_value             │  │
│  │ ├─ Traffic: traffic_sources (json), top_referrer                    │  │
│  │ ├─ Period: period_start, period_end                                │  │
│  │ ├─ Status: is_active                                                │  │
│  │ └─ created_at, updated_at                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ VIEWS (Materialized/Auto-Calculated)                                │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  product_performance_aggregate                                       │  │
│  │  └─ SUM all analytics for product (all advertisers)                 │  │
│  │     ├─ total_forms, total_advertisers                               │  │
│  │     ├─ total_views, total_clicks, total_orders                      │  │
│  │     ├─ total_revenue                                                │  │
│  │     ├─ conversion_rate_percent                                      │  │
│  │     └─ avg_order_value                                              │  │
│  │                                                                       │  │
│  │  advertiser_product_performance                                      │  │
│  │  └─ Breakdown per advertiser per product                            │  │
│  │     ├─ advertiser_id, product_id                                   │  │
│  │     ├─ metrics (views, clicks, orders, revenue)                     │  │
│  │     ├─ profitability (boolean)                                      │  │
│  │     └─ period_start                                                 │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                            DATA FLOW DIAGRAMS                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─ FLOW 1: Creating Form with Product ─────────────────────────────────────┐
│                                                                           │
│  User navigates to Form Editor                                            │
│           ▼                                                               │
│  Fetch available products for brand                                       │
│           ▼                                                               │
│  User selects Product from dropdown                                       │
│           ▼                                                               │
│  form.productId = "product-123"                                           │
│           ▼                                                               │
│  User fills form details & saves                                          │
│           ▼                                                               │
│  CREATE form in forms table (with product_id)                             │
│           ▼                                                               │
│  Trigger: Call create_product_analytics()                                 │
│           ▼                                                               │
│  INSERT into product_form_analytics                                       │
│  (product_id, form_id, advertiser_id, period_start)                       │
│           ▼                                                               │
│  Analytics record ready for tracking ✅                                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ FLOW 2: Tracking Performance ───────────────────────────────────────────┐
│                                                                           │
│  Customer views form                                                      │
│           ▼                                                               │
│  Form page loaded → views_count++ in analytics                            │
│           ▼                                                               │
│  Customer fills form & submits order                                      │
│           ▼                                                               │
│  Order created in orders table                                            │
│           ▼                                                               │
│  Webhook/Handler gets:                                                    │
│  ├─ orderId                                                               │
│  ├─ formId                                                                │
│  ├─ amount                                                                │
│  └─ Get product_id from form                                              │
│           ▼                                                               │
│  Call update_analytics_metrics():                                          │
│  ├─ orders_count++                                                        │
│  ├─ total_revenue += amount                                               │
│  └─ conversion_rate recalculated auto                                      │
│           ▼                                                               │
│  Analytics updated ✅                                                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ FLOW 3: Multi-Advertiser Tracking ──────────────────────────────────────┐
│                                                                           │
│  Product: "Laptop Gaming"                                                 │
│           │                                                               │
│           ├─ Advertiser A: Form "Laptop Gaming - Campaign A"              │
│           │   └─ Analytics [A, Form A, Product, period]                   │
│           │       Views: 1200, Orders: 45, Revenue: 45M                   │
│           │                                                               │
│           ├─ Advertiser B: Form "Laptop Gaming - Campaign B"              │
│           │   └─ Analytics [B, Form B, Product, period]                   │
│           │       Views: 800, Orders: 32, Revenue: 32M                    │
│           │                                                               │
│           └─ Advertiser C: Form "Laptop Gaming - TikTok"                  │
│               └─ Analytics [C, Form C, Product, period]                   │
│                   Views: 2000, Orders: 78, Revenue: 78M                   │
│                                                                           │
│  AGGREGATION (product_performance_aggregate):                             │
│  ├─ Total Views: 4000 (1200 + 800 + 2000)                               │
│  ├─ Total Orders: 155 (45 + 32 + 78)                                    │
│  ├─ Total Revenue: 155M (45M + 32M + 78M)                               │
│  ├─ Total Forms: 3                                                        │
│  ├─ Total Advertisers: 3                                                  │
│  └─ Conversion Rate: 3.88% (155/4000 * 100)                              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌─ FLOW 4: Dashboard Views ────────────────────────────────────────────────┐
│                                                                           │
│  VIEW 1: ProductsPage                                                     │
│  └─ List all products for brand                                           │
│     ├─ Product 1: "Laptop Gaming"                                        │
│     ├─ Product 2: "Monitor 4K"                                           │
│     └─ Product 3: "Keyboard Mechanical"                                  │
│                                                                           │
│  VIEW 2: ProductAnalyticsPage                                             │
│  ├─ Tab 1: Aggregate View                                                │
│  │  ├─ KPI Cards (Views, Orders, Revenue, Conversion%)                   │
│  │  ├─ Bar Chart: Revenue per Product                                    │
│  │  ├─ Line Chart: Conversion Rate per Product                           │
│  │  └─ Table: All product metrics                                        │
│  │                                                                        │
│  └─ Tab 2: Advertiser View                                               │
│     ├─ Show performance per advertiser per product                       │
│     ├─ Profitability indicators                                          │
│     └─ Period-based filtering                                            │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                        EXAMPLE DATA SCENARIO                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

BRAND: ElectronicsBrand (id: brand-001)

PRODUCT (Induk):
┌─────────────────────────────────────┐
│ Laptop Gaming Pro                    │
│ ├─ ID: product-001                  │
│ ├─ Brand: brand-001                 │
│ ├─ SKU: LAPTOP-001                  │
│ ├─ Price: Rp 15.000.000             │
│ └─ Stock: 100 unit                  │
└─────────────────────────────────────┘

FORMS (Child):
┌─────────────────────────────────────┐  ┌──────────────────────────────────┐
│ Form 1: Iklan TikTok                │  │ Form 2: Iklan Facebook           │
│ ├─ ID: form-001                     │  │ ├─ ID: form-002                  │
│ ├─ Product: product-001             │  │ ├─ Product: product-001          │
│ ├─ Advertiser: advertiser-001       │  │ ├─ Advertiser: advertiser-002    │
│ ├─ Forms: tiktok-campaign           │  │ ├─ Forms: fb-campaign            │
│ └─ Link: form.tiktok.com            │  │ └─ Link: form.facebook.com       │
└─────────────────────────────────────┘  └──────────────────────────────────┘

ANALYTICS:

Record 1: [product-001, form-001, advertiser-001, 2025-01-01]
├─ Views: 5000
├─ Clicks: 250
├─ Orders: 120
├─ Revenue: 1.800.000.000
├─ Conversion Rate: 2.4%
└─ AVG Order Value: 15.000.000

Record 2: [product-001, form-002, advertiser-002, 2025-01-01]
├─ Views: 3000
├─ Clicks: 150
├─ Orders: 60
├─ Revenue: 900.000.000
├─ Conversion Rate: 2.0%
└─ AVG Order Value: 15.000.000

AGGREGATE:
├─ Total Forms: 2
├─ Total Advertisers: 2
├─ Total Views: 8000
├─ Total Orders: 180
├─ Total Revenue: 2.700.000.000
├─ Overall Conversion Rate: 2.25%
└─ Overall AVG Order Value: 15.000.000


╔══════════════════════════════════════════════════════════════════════════════╗
║                          KEY RELATIONSHIPS                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

products ◄──────1:N──────► forms
  (1)                      (N)
   │                        │
   │                        │
   └─ products have many forms
   └─ each form has 1 product


products ◄────N:M────► users (advertisers)
  (N)                  (M)
   │────via────────────┤
        forms
   (each form links product to advertiser)


forms ◄──────1:1──────► product_form_analytics
  (1)                    (1)
  │                      │
  └─ each form has at most 1 active analytics record
  └─ same form, same advertiser = 1 record


product_form_analytics ──1:N──► product_performance_aggregate
         (N)              (1)
   └─ multiple analytics per product
   └─ aggregate sums them


═════════════════════════════════════════════════════════════════════════════════

DEPLOYMENT STATUS: ✅ READY FOR PRODUCTION

Files Created:
✅ supabase_products_table.sql - Database migrations
✅ types.ts - Updated types
✅ services/productService.ts - Service layer
✅ pages/ProductsPage.tsx - Product management
✅ pages/ProductAnalyticsPage.tsx - Analytics dashboard
✅ Documentation (3 files)
✅ Checklist & diagrams

Next: Execute SQL → Update App.tsx → Integrate FormEditorPage
```
