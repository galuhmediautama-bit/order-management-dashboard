# ⚡ QUICK ACTION - Pre-Launch Checklist

## Status: ✅ **ZERO ERRORS DETECTED** - Ready for Launch

---

## 🔴 CRITICAL ACTIONS (Do These Now)

### 1. Configure `.env.local` with Production Credentials
**File**: `d:\order-management-dashboard\.env.local`

Current:
```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

Required:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-key
```

**Why**: Without this, app uses fallback dev project → data shows as 0 → sidebar empty

**How to Get**:
1. Open Supabase Dashboard → Project Settings
2. Copy API URL + Anon Key
3. Paste into `.env.local`
4. Save file

---

### 2. Test the Build

```powershell
cd d:\order-management-dashboard
npm install
npm run build
```

**Expected**:
- No errors in console
- `dist/` folder created
- Files in `dist/` should reference your env variables

**If it fails**: Check `.env.local` syntax (no spaces around `=`)

---

### 3. Manual Testing (5 min)

Start dev server:
```powershell
npm run dev
# Open http://localhost:3000
```

Test these:
- [ ] Login as Super Admin (all menus visible?)
- [ ] Forms page loads (no console errors?)
- [ ] Orders page shows data (or empty if no data seeded)
- [ ] Click on a form → ADV Assign shows name (not ID)?
- [ ] Notifications page loads (badge shows correct count?)
- [ ] Settings page accessible (user list shows names?)

---

## 🟡 RECOMMENDED ACTIONS (Before Going Live)

### 1. Seed Test Data (10 min)

Run in Supabase SQL Editor:

```sql
-- 1. Create test users
INSERT INTO users (id, email, name, role, status) VALUES
  ('test-admin-' || gen_random_uuid()::text, 'admin@test.com', 'Admin User', 'Super Admin', 'Aktif'),
  ('test-adv-' || gen_random_uuid()::text, 'advertiser@test.com', 'Test Advertiser', 'Advertiser', 'Aktif'),
  ('test-cs-' || gen_random_uuid()::text, 'cs@test.com', 'CS Agent', 'Customer service', 'Aktif');

-- 2. Create test brand
INSERT INTO brands (name, description) VALUES
  ('Test Brand 1', 'For testing');

-- 3. Create test product (replace brand_id)
INSERT INTO induk_produk (brand_id, name, description, price) VALUES
  ((SELECT id FROM brands LIMIT 1), 'Test Product', 'Sample product', 100000);
```

**Why**: Ensures data is not empty, all features work correctly

---

### 2. Fix Old Notifications (if exists)

If Notifications page shows 0 items but badge shows count:

```sql
-- Add user_id to old rows
UPDATE notifications 
SET user_id = auth.uid() 
WHERE user_id IS NULL;
```

---

## 📋 Deployment Steps

### Option 1: DigitalOcean App Platform (Recommended)

1. Push code to GitHub
2. In DigitalOcean: Create new App → Connect GitHub repo
3. Set Environment Variables:
   ```
   VITE_SUPABASE_URL=xxx
   VITE_SUPABASE_ANON_KEY=xxx
   GEMINI_API_KEY=xxx
   ```
4. Deploy (auto-builds and deploys)
5. Point domain to DigitalOcean URL

See: `DEPLOYMENT_DIGITALOCEAN.md`

### Option 2: Vercel (Simple)

1. Push code to GitHub
2. In Vercel: Import project from GitHub
3. Set Environment Variables (same as above)
4. Deploy (1-click)

### Option 3: Manual Deploy

```bash
npm run build
# Upload dist/ folder to your web server
# Point domain to web server
```

---

## ⚠️ Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| Sidebar empty, data=0 | Check `.env.local` has Supabase credentials |
| "Cannot read property 'email' of null" | Ensure user is logged in, check Auth status |
| ADV Assign shows ID like "[ID: 530829...]" | User record missing name field (acceptable, auto-fallback) |
| Notifications page shows 0 | Run SQL backfill query (see recommended actions) |
| Build fails | Run `npm install` again, check Node version |

---

## 🎯 Final Checklist

Before clicking "Deploy":

- [ ] `.env.local` has real Supabase URL and Anon Key
- [ ] `npm run build` succeeds with 0 errors
- [ ] Manual testing passed (login, forms, orders work)
- [ ] Test data seeded (at least 1 Super Admin, 1 Advertiser)
- [ ] Notifications/other features tested
- [ ] Domain configured (if using custom domain)
- [ ] HTTPS enabled (automatic on most platforms)

---

## 📞 Support

If issues arise:

1. Check browser console (F12) for errors
2. Check Supabase logs (Dashboard → Logs)
3. Check Network tab (F12) for failed requests
4. Read `PRE_LAUNCH_ERROR_AUDIT_REPORT.md` for detailed debugging guide

---

## ✅ Summary

**No Critical Errors Found** ✅
- TypeScript: 0 errors
- Imports: All valid
- Context usage: Correct
- Error handling: Implemented
- Build: Ready

**One Critical Config Missing**:
- `.env.local` needs Supabase credentials

**Estimated Time to Deploy**: 15-30 minutes (including testing)

---

**Next Action**: Update `.env.local` → test build → deploy! 🚀
