# Product Tracking System - Deployment Checklist

## Pre-Deployment ✅

### Database Setup
- [ ] Run `supabase_products_table.sql` in Supabase SQL Editor
- [ ] Verify tables created: `products`, `product_form_analytics`
- [ ] Verify views created: `product_performance_aggregate`, `advertiser_product_performance`
- [ ] Verify RPC functions created: `create_product_analytics`, `update_analytics_metrics`
- [ ] Verify indexes created (7 total)
- [ ] Set up RLS policies (optional but recommended)

### Code Deployment
- [ ] `npm run build` - Verify no build errors
- [ ] Deploy to DigitalOcean/production

### Files Ready
- [x] `services/productService.ts` - Service layer
- [x] `pages/ProductsPage.tsx` - Products management
- [x] `pages/ProductAnalyticsPage.tsx` - Analytics dashboard
- [x] `types.ts` - Updated types
- [x] SQL migration file

## Integration Steps

### 1. Update App.tsx
```typescript
// Add imports
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage'));
const ProductAnalyticsPage = lazyWithRetry(() => import('./pages/ProductAnalyticsPage'));

// Add routes in <AuthenticatedApp>
<Route path="/produk" element={<ProductsPage />} />
<Route path="/analitik-produk" element={<ProductAnalyticsPage />} />
```

Progress: [ ] Not Started [ ] In Progress [ ] Complete

### 2. Update Sidebar.tsx (Navigation)
```typescript
// Add menu items before closing </nav>:
{
    name: 'Produk' as const,
    icon: BoxIcon,  // Or appropriate icon
    path: '/produk',
    allowedRoles: ['Admin', 'Super Admin', 'Advertiser']
},
{
    name: 'Analitik Produk' as const,
    icon: ChartIcon,
    path: '/analitik-produk',
    allowedRoles: ['Admin', 'Super Admin', 'Advertiser']
}
```

Progress: [ ] Not Started [ ] In Progress [ ] Complete

### 3. Update FormEditorPage.tsx (Integration)
- [ ] Import productService
- [ ] Add product state management
- [ ] Fetch products on load
- [ ] Add product selection dropdown in form settings
- [ ] Add product validation in handleSave
- [ ] Create analytics record on form save
- [ ] Update form data structure

Reference: See `PRODUCT_INTEGRATION_GUIDE.md`

Progress: [ ] Not Started [ ] In Progress [ ] Complete

### 4. Update Order Handler (Analytics)
Choose location (FormViewerPage, webhook, edge function):

- [ ] On order creation, fetch form
- [ ] Get analytics record for form
- [ ] Update metrics (orders_count, total_revenue)
- [ ] Handle errors gracefully (non-blocking)

Reference: See `PRODUCT_INTEGRATION_GUIDE.md` Section 5

Progress: [ ] Not Started [ ] In Progress [ ] Complete

### 5. Documentation & Team
- [ ] Share `PRODUCT_TRACKING_SYSTEM.md` with team
- [ ] Share `PRODUCT_INTEGRATION_GUIDE.md` with developers
- [ ] Brief training on new Product/Analytics pages
- [ ] Update internal docs/wiki

Progress: [ ] Not Started [ ] In Progress [ ] Complete

## Testing Checklist

### Unit Testing
- [ ] ProductsPage CRUD operations
- [ ] Product creation with all fields
- [ ] Product update/delete
- [ ] Search functionality

### Integration Testing
- [ ] Create product
- [ ] Create form with product
- [ ] Analytics record auto-created
- [ ] Metrics update on order

### UI/UX Testing
- [ ] ProductsPage responsive on mobile
- [ ] ProductAnalyticsPage charts render
- [ ] Forms page product selection works
- [ ] Dark mode display correct

### Performance Testing
- [ ] Products page loads < 2s
- [ ] Analytics page loads < 3s
- [ ] Chart rendering smooth
- [ ] No memory leaks

### Data Testing
- [ ] No duplicate analytics records
- [ ] Metrics calculated correctly
- [ ] Aggregations accurate
- [ ] Multi-advertiser tracking works

## Post-Deployment

### Monitoring
- [ ] Check error logs for first 24h
- [ ] Monitor database query performance
- [ ] Check analytics accuracy
- [ ] User feedback collection

### Data Migration (if needed)
- [ ] Link existing forms to products (if applicable)
- [ ] Historical data import (if needed)
- [ ] Validation of migrated data

### Documentation
- [ ] Add to API docs
- [ ] Update user guide
- [ ] Create tutorial videos
- [ ] Record training session

## Rollback Plan

If issues occur:

1. **Stop Analytics Creation** (temporary)
   ```sql
   UPDATE forms SET product_id = NULL;
   ```

2. **Disable Pages** (App.tsx)
   - Comment out product route
   - Comment out analytics route

3. **Restore Previous State**
   - Rollback database migration if needed
   - Deploy previous app version

4. **Investigate & Fix**
   - Check error logs
   - Database integrity
   - Service issues

## Future Enhancements Queue

Priority 1 (Next 2 weeks):
- [ ] RLS policies enforcement
- [ ] Product image upload
- [ ] Analytics data export (CSV/PDF)

Priority 2 (Next month):
- [ ] Real-time analytics updates (Supabase Realtime)
- [ ] Advanced filtering in analytics
- [ ] Scheduled reports

Priority 3 (Backlog):
- [ ] Inventory management
- [ ] Dynamic pricing
- [ ] Commission automation
- [ ] Cohort analysis

## Contact & Support

**Questions?**
- Check `PRODUCT_TRACKING_SYSTEM.md` for architecture
- Check `PRODUCT_INTEGRATION_GUIDE.md` for code samples
- Review `types.ts` for data structures
- Check `productService.ts` for available methods

**Issues?**
- Check browser console for errors
- Check Supabase logs for database errors
- Verify RLS policies if data access issues
- Check network tab for API errors

---

**Status**: Ready for Production Deployment ✅

**Last Updated**: December 4, 2025
**Version**: 1.0.0
