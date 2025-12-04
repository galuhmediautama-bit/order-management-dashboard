# Product Tracking System - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

### 1. Execute SQL
```bash
# Copy entire supabase_products_table.sql
# Paste in Supabase SQL Editor
# Run → Should see success message
```

### 2. Update Routes (App.tsx)
```typescript
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage'));
const ProductAnalyticsPage = lazyWithRetry(() => import('./pages/ProductAnalyticsPage'));

<Route path="/produk" element={<ProductsPage />} />
<Route path="/analitik-produk" element={<ProductAnalyticsPage />} />
```

### 3. Add Navigation (Sidebar.tsx)
```typescript
{ name: 'Produk', icon: BoxIcon, path: '/produk' },
{ name: 'Analitik Produk', icon: ChartIcon, path: '/analitik-produk' }
```

### 4. Integrate Form Editor
See: `PRODUCT_INTEGRATION_GUIDE.md` Section 1-3

## 📚 Documentation Map

| Need | Document | Section |
|------|----------|---------|
| Full Architecture | PRODUCT_TRACKING_SYSTEM.md | Architecture section |
| Code Examples | PRODUCT_INTEGRATION_GUIDE.md | All sections |
| Implementation Steps | PRODUCT_TRACKING_IMPLEMENTATION.md | Next Steps |
| Deployment Tasks | PRODUCT_TRACKING_CHECKLIST.md | Integration Steps |
| Visual Diagrams | PRODUCT_ARCHITECTURE_DIAGRAM.md | Data flows |
| Complete Summary | PRODUCT_TRACKING_COMPLETE_SUMMARY.md | Executive summary |

## 🎯 Main Concepts

### Entities
- **Product**: Induk produk (Laptop Gaming)
- **Form**: Advertisement campaign (Iklan TikTok untuk Laptop Gaming)
- **Advertiser**: Who runs the campaign (Advertiser A)
- **Analytics**: Tracking data (Views, Orders, Revenue)

### Relationships
```
Product (1) ──→ (N) Forms
Product (1) ──→ (N) Advertisers (via Forms)
Form (1) ──→ (1) Analytics Record
Product (1) ──→ (N) Analytics (aggregated)
```

## 📊 Service Methods Cheat Sheet

### Get Data
```typescript
// Products
productService.getProductsByBrand(brandId)
productService.getProduct(productId)

// Analytics
productService.getFormAnalytics(formId)
productService.getProductAnalytics(productId)
productService.getAdvertiserProductAnalytics(advertiserId)

// Aggregates
productService.getProductPerformanceAggregate(productId)
productService.getBrandProductsPerformance(brandId)
productService.getAdvertiserPerformancePerProduct(advertiserId)
```

### Modify Data
```typescript
// Create/Update
productService.createProduct(productData)
productService.updateProduct(productId, updates)
productService.deleteProduct(productId)

// Analytics
productService.createOrGetAnalytics(productId, formId, advertiserId)
productService.updateAnalyticsMetrics(analyticsId, { ordersCount, totalRevenue })

// Linking
productService.linkFormToProduct(formId, productId)
productService.unlinkFormFromProduct(formId)
```

## 🔧 Common Tasks

### Create Product
```typescript
const product = await productService.createProduct({
    brandId: currentUser.id,
    name: 'Laptop Gaming Pro',
    sku: 'LAPTOP-001',
    basePrice: 15000000,
    status: 'active',
    isFeatured: false,
    tags: [],
    attributes: {},
    stockTracking: { enabled: false, current: 0 }
});
```

### Create/Get Analytics
```typescript
const analytics = await productService.createOrGetAnalytics(
    productId,
    formId,
    advertiserId
);
```

### Update Metrics
```typescript
await productService.updateAnalyticsMetrics(analyticsId, {
    ordersCount: analytics.ordersCount + 1,
    totalRevenue: analytics.totalRevenue + orderAmount
});
// Auto-calculates: conversion_rate, average_order_value
```

### Get Brand Performance
```typescript
const performance = await productService.getBrandProductsPerformance(brandId);
// Returns: array of ProductPerformanceAggregate
// Contains: total_views, total_orders, total_revenue, conversion_rate_percent
```

## 💾 Database Quick Reference

### Products Table
```sql
SELECT * FROM products WHERE brand_id = 'user-id' AND status = 'active';
```

### Analytics Table
```sql
-- For specific form
SELECT * FROM product_form_analytics WHERE form_id = 'form-id';

-- For product
SELECT * FROM product_form_analytics WHERE product_id = 'product-id';

-- For advertiser
SELECT * FROM product_form_analytics WHERE advertiser_id = 'user-id';
```

### Views
```sql
-- Product aggregate
SELECT * FROM product_performance_aggregate WHERE product_id = 'product-id';

-- Advertiser breakdown
SELECT * FROM advertiser_product_performance WHERE advertiser_id = 'user-id';
```

## 🔗 Integration Points

### FormEditorPage
- Add product selection dropdown
- Validate product selected
- Create analytics on save
- Pre-fill with product data

### Order Handler
- Get form on order creation
- Get analytics for form
- Update metrics
- Handle errors gracefully

### FormsPage
- Show linked product
- Link to product analytics
- Bulk link/unlink operations

## ✅ Validation Rules

- Product name: Required, unique per brand
- Form product: Required (for analytics)
- Analytics metrics: Auto-calculated
- Period tracking: Unique per period
- Soft delete: Mark as archived (not hard delete)

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Product not showing | Check brand_id matches current user |
| Analytics not created | Ensure form has product_id set |
| Metrics not updating | Check analytics record exists |
| Views not matching | Check period_start is current date |
| Performance slow | Verify indexes created |

## 📱 UI Navigation

```
Dashboard
├─ Produk → ProductsPage
│  ├─ Create product
│  ├─ Edit product
│  └─ Delete product
│
└─ Analitik Produk → ProductAnalyticsPage
   ├─ View 1: Product Aggregate
   │  ├─ KPI cards
   │  ├─ Revenue chart
   │  └─ Metrics table
   │
   └─ View 2: Advertiser Performance
      ├─ Breakdown table
      └─ Profitability
```

## 🎓 Learning Path

1. **Basics** (5 min)
   - Read: Overview in this card
   - Understand: 1 Product → N Forms

2. **Architecture** (15 min)
   - Read: PRODUCT_TRACKING_SYSTEM.md
   - Study: Diagrams in PRODUCT_ARCHITECTURE_DIAGRAM.md

3. **Integration** (30 min)
   - Read: PRODUCT_INTEGRATION_GUIDE.md
   - Copy: Code examples
   - Update: Your files

4. **Deployment** (15 min)
   - Read: PRODUCT_TRACKING_CHECKLIST.md
   - Execute: Each step
   - Verify: Each step

## 📞 Quick Contacts

**Questions on:**
- Architecture → PRODUCT_TRACKING_SYSTEM.md
- Code → PRODUCT_INTEGRATION_GUIDE.md
- Deployment → PRODUCT_TRACKING_CHECKLIST.md
- Diagrams → PRODUCT_ARCHITECTURE_DIAGRAM.md
- Summary → PRODUCT_TRACKING_COMPLETE_SUMMARY.md

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `supabase_products_table.sql` | Database migrations |
| `types.ts` | TypeScript types |
| `productService.ts` | Service layer (17 methods) |
| `ProductsPage.tsx` | Product management UI |
| `ProductAnalyticsPage.tsx` | Analytics dashboard |

## 📊 Data Example

```
Product: Laptop Gaming
├─ Form A: Iklan TikTok (Advertiser A)
│  └─ Views: 5000, Orders: 120, Revenue: 1.8B
│
├─ Form B: Iklan Facebook (Advertiser B)
│  └─ Views: 3000, Orders: 60, Revenue: 900M
│
└─ AGGREGATE
   └─ Views: 8000, Orders: 180, Revenue: 2.7B
```

## ✨ Features at a Glance

- ✅ One-to-many: 1 Product → N Forms
- ✅ Multi-advertiser: Different ads for same product
- ✅ Tracking: Views, clicks, orders, revenue
- ✅ Auto-calculation: Conversion rate, order value
- ✅ Aggregation: Total metrics per product
- ✅ Real-time: Updates on order
- ✅ Scalable: Indexed, optimized views
- ✅ Secure: RLS-ready policies

---

**Print this card for quick reference!**
**Last Updated**: December 4, 2025
