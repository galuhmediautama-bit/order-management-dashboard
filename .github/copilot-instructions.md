# Order Management Dashboard - AI Agent Instructions

## Project Overview
Multi-tenant order management system for e-commerce with advanced form builder, commission tracking, and analytics. Built with React + TypeScript + Vite, backed by Supabase.

## Tech Stack & Architecture

### Core Technologies
- **Frontend**: React 19.2, TypeScript 5.8, Vite 6.2, React Router 6 (HashRouter)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS (via className, no CSS files)
- **State**: React Context API (SettingsContext, LanguageContext, ToastContext)
- **Charts**: Recharts
- **Deployment**: DigitalOcean App Platform (see START_HERE.md, DEPLOYMENT_START_HERE.md)

### Project Structure
```
App.tsx                    # Root: Auth flow, HashRouter, lazy loading with retry
types.ts                   # Central type definitions (Order, Form, User, etc.)
firebase.ts                # Supabase client config (NOT Firebase despite name)
contexts/                  # Global state (Settings, Language, Toast)
pages/                     # All page components (lazy loaded)
components/                # Reusable UI components
  icons/                   # SVG icon components
  landing/                 # Landing page components
```

## Critical Architecture Patterns

### 1. Authentication & User Roles
- Auth managed via `supabase.auth` with session-based validation
- Role-based access: `Super Admin | Admin | Keuangan | Customer service | Advertiser | Partner`
- User status validation: Only `status: 'Aktif'` can access dashboard (see `App.tsx` `validateUserStatus`)
- Pending users (`status: 'Tidak Aktif'`) handled in `/pengaturan/pending-users`

### 2. Database Schema (Supabase)
**Key Tables**:
- `orders`: Main order table with dual commission system (`csCommission`, `advCommission`)
- `forms`: Order page builder data with advanced product variants
- `users`: User profiles with `assignedBrandIds[]` for advertisers
- `abandoned_carts`: Cart abandonment tracking
- `ad_campaigns`: Ad performance data
- `settings`: Global settings (website config, tracking pixels)

**Commission System** (see COMMISSION_SYSTEM.md):
- Dual commission: CS commission (`csCommission`) + Advertiser commission (`advCommission`)
- Commission snapshot saved per order from form variant settings
- CS: Based on `assignedCsId` for Shipped/Delivered orders
- Advertiser: Based on `brandId` matching user's `assignedBrandIds[]`

### 3. Form System Architecture
**Forms are landing pages** with embedded order functionality:
- Access via `/f/:identifier` (UUID or custom slug)
- Support multiple product variants with independent commission rates
- Advanced features: countdown timers, stock countdown, social proof popups, tracking pixels
- CS Assignment modes: `single` or `round_robin` with percentage distribution
- Thank you page: Show summary or redirect with WhatsApp confirmation

**Form Data Flow**:
1. `FormEditorPage`: Visual builder → saves to `forms` table
2. `FormViewerPage`: Public form → validates → creates order in `orders` table
3. Order includes commission snapshot from selected variant

### 4. Lazy Loading Pattern
All pages use `lazyWithRetry()` helper (App.tsx):
```typescript
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  React.lazy(async () => {
    try { return await componentImport(); }
    catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await componentImport(); // Retry mechanism for slow networks
    }
  });
```

### 5. Multi-language Support
- `LanguageContext` with `id` (Indonesian) and `en` (English)
- Use `useLanguage()` hook → `t('key.path')` for translations
- All translations defined in `LanguageContext.tsx`

### 6. Global Settings
`SettingsContext` loads from Supabase `settings` table:
- `websiteSettings`: Site name, logo, branding
- `trackingSettings`: Global tracking pixels (Meta, Google, TikTok, Snack)
- Forms can override with form-level tracking

## Development Workflows

### Running Locally
```powershell
npm install
npm run dev  # Vite dev server on port 3000
```

### Environment Variables
Required in `.env.local`:
```
GEMINI_API_KEY=your_key  # Used for AI features
```
Supabase credentials hardcoded in `firebase.ts` (consider moving to env)

### Common Operations

**Adding a new page**:
1. Create in `pages/NewPage.tsx`
2. Add lazy import in `App.tsx`
3. Add route in `AuthenticatedApp` Routes
4. Update `types.ts` Page union type
5. Add to sidebar in `Sidebar.tsx` if needed

**Database queries**:
```typescript
// Always use camelCase for column names in queries
const { data } = await supabase.from('orders')
  .select('*')
  .eq('assignedCsId', userId)
  .in('status', ['Shipped', 'Delivered']);
```

**Modals pattern**:
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Type | null>(null);
// Open: setSelectedItem(item); setIsModalOpen(true);
```

### Styling Conventions
- All styling via Tailwind inline classes
- Dark mode: Use `dark:` prefix, theme managed in `App.tsx`
- Color scheme: Indigo primary (`indigo-600`), slate grays
- Icons: Custom SVG components in `components/icons/`, receive `className` prop

### Data Filtering Pattern
For brand-filtered views (CS, Advertiser):
```typescript
import { filterDataByBrand } from '../utils';
const filteredOrders = filterDataByBrand(orders, currentUser, 'brandId');
```

## Key Files Reference

- **types.ts**: Single source of truth for all TypeScript types
- **utils.ts**: `capitalizeWords`, `filterDataByBrand`, `getNormalizedRole`
- **COMMISSION_SYSTEM.md**: Complete guide to dual commission system
- **supabase_*.sql**: Database schema migration scripts
- **DEPLOYMENT_*.md**: Production deployment guides (12+ docs)

## Testing & Debugging

### Type Checking
```powershell
npx tsc --noEmit  # Check for TypeScript errors
```

### Common Issues
- **Form not saving**: Check `FormEditorPage.tsx` `handleSave()` → verify `forms` table schema
- **Commission not calculating**: Verify `csCommission`/`advCommission` in variant, check order status
- **User can't login**: Check `users` table `status` field (must be 'Aktif')
- **Lazy load failure**: `lazyWithRetry` handles retries, check network/build artifacts

## Deployment Notes

- **Build Command**: `npm install && npm run build`
- **Output**: `dist/` directory
- **Preview**: `npx vite preview --host 0.0.0.0 --port 8080`
- **GitHub Actions**: `.github/workflows/deploy.yml` for CI/CD
- **Domain/SSL**: See SETUP_DOMAIN_SSL_LETSENCRYPT.md

## Project-Specific Conventions

1. **No Firebase**: Despite `firebase.ts` name, this uses Supabase exclusively
2. **HashRouter**: Uses `#` URLs for client-side routing (e.g., `/#/dashboard`)
3. **Supabase Column Names**: Use double quotes for camelCase (`"customerPhone"`)
4. **Commission Backward Compatibility**: Old `commissionSnapshot` field still written but `csCommission`/`advCommission` are primary
5. **Form Slugs**: Support both UUID and custom slugs for SEO-friendly URLs
6. **CS Assignment**: Round robin uses percentage-based distribution, not strict rotation

## Integration Points

- **WhatsApp**: Order confirmations via `wa.me/{number}?text={encoded}`
- **Tracking Pixels**: Meta/Google/TikTok/Snack integration in form pages + thank you pages
- **Image Upload**: Supabase Storage with public bucket access
- **Gemini API**: Configured in vite.config.ts for AI features

## Performance Optimizations

- Route-based code splitting via lazy loading with retry
- Pagination on large tables (orders, customers)
- Memoized filters with `useMemo`
- Global settings cached in Context (fetched once)

## Security Notes

- RLS (Row Level Security) should be configured in Supabase for multi-tenant isolation
- Auth checks in `App.tsx` before rendering authenticated routes
- API keys exposed in `firebase.ts` - use environment variables in production
- User status validation prevents inactive users from accessing system

---

**When in doubt**: Check `types.ts` for data structures, `COMMISSION_SYSTEM.md` for business logic, and deployment docs for production setup.
