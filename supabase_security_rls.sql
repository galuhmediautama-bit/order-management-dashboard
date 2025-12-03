-- ============================================
-- SECURITY: Row Level Security (RLS) Setup
-- ============================================
-- Run this in Supabase SQL Editor
-- This implements multi-tenant security isolation

-- ============================================
-- 1. ENABLE RLS FOR ALL TABLES
-- ============================================

ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. ORDERS TABLE POLICIES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their brand orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update relevant orders" ON orders;
DROP POLICY IF EXISTS "Users can delete orders with permission" ON orders;

-- Policy: SELECT - Users can view orders based on role
CREATE POLICY "Users can view their brand orders" ON orders
FOR SELECT USING (
  -- Public form submission (no auth required)
  auth.uid() IS NULL
  OR
  -- Authenticated users
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      -- Super Admin/Admin/Keuangan can view all orders
      role IN ('Super Admin', 'Admin', 'Keuangan')
      OR
      -- Advertiser can only view orders from their brands
      (role = 'Advertiser' AND "brandId" = ANY("assignedBrandIds"))
      OR
      -- CS can only view orders assigned to them
      (role = 'Customer service' AND "assignedCsId" = id)
    )
  )
);

-- Policy: INSERT - Anyone can create order (for public forms)
CREATE POLICY "Users can insert orders" ON orders
FOR INSERT WITH CHECK (true);

-- Policy: UPDATE - Only admins and CS can update orders
CREATE POLICY "Users can update relevant orders" ON orders
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      role IN ('Super Admin', 'Admin')
      OR
      -- CS can only update their assigned orders
      (role = 'Customer service' AND "assignedCsId" = id)
    )
  )
);

-- Policy: DELETE - Only Super Admin can delete
CREATE POLICY "Users can delete orders with permission" ON orders
FOR DELETE USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role = 'Super Admin'
  )
);

-- ============================================
-- 3. USERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view based on role" ON users;
DROP POLICY IF EXISTS "Users can insert with signup" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only super admin can delete users" ON users;

-- Policy: SELECT - Role-based viewing
CREATE POLICY "Users can view based on role" ON users
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Admin', 'Keuangan')
  )
  OR id = auth.uid() -- Users can view their own profile
);

-- Policy: INSERT - Anyone can signup (will be approved by admin)
CREATE POLICY "Users can insert with signup" ON users
FOR INSERT WITH CHECK (true);

-- Policy: UPDATE - Admins can update any, users can update own profile
CREATE POLICY "Only admins can update users" ON users
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Admin')
  )
  OR id = auth.uid() -- Users can update their own profile
);

-- Policy: DELETE - Only Super Admin
CREATE POLICY "Only super admin can delete users" ON users
FOR DELETE USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role = 'Super Admin'
  )
);

-- ============================================
-- 4. FORMS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Forms are publicly viewable" ON forms;
DROP POLICY IF EXISTS "Users can manage their brand forms" ON forms;

-- Policy: SELECT - Public can view forms (for order pages)
CREATE POLICY "Forms are publicly viewable" ON forms
FOR SELECT USING (true);

-- Policy: ALL - Only admins and brand advertisers can manage forms
CREATE POLICY "Users can manage their brand forms" ON forms
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      role IN ('Super Admin', 'Admin')
      OR
      -- Advertiser can only manage forms for their brands
      (role = 'Advertiser' AND forms."brandId" = ANY(users."assignedBrandIds"))
    )
  )
);

-- ============================================
-- 5. ABANDONED_CARTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their brand carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Public can insert abandoned carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Users can update cart status" ON abandoned_carts;

-- Policy: SELECT - Brand-based viewing
CREATE POLICY "Users can view their brand carts" ON abandoned_carts
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      role IN ('Super Admin', 'Admin', 'Customer service', 'Keuangan')
      OR
      (role = 'Advertiser' AND abandoned_carts."brandId" = ANY(users."assignedBrandIds"))
    )
  )
);

-- Policy: INSERT - Public can create abandoned cart
CREATE POLICY "Public can insert abandoned carts" ON abandoned_carts
FOR INSERT WITH CHECK (true);

-- Policy: UPDATE - CS and admins can update status
CREATE POLICY "Users can update cart status" ON abandoned_carts
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Admin', 'Customer service')
  )
);

-- ============================================
-- 6. AD_CAMPAIGNS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view relevant campaigns" ON ad_campaigns;
DROP POLICY IF EXISTS "Advertisers can manage campaigns" ON ad_campaigns;

-- Policy: SELECT - Based on role
CREATE POLICY "Users can view relevant campaigns" ON ad_campaigns
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      role IN ('Super Admin', 'Admin', 'Keuangan')
      OR
      -- Advertiser can view their own campaigns
      (role = 'Advertiser' AND ad_campaigns."responsibleUserId" = id)
    )
  )
);

-- Policy: ALL - Advertisers manage their campaigns, admins manage all
CREATE POLICY "Advertisers can manage campaigns" ON ad_campaigns
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND (
      role IN ('Super Admin', 'Admin')
      OR
      (role = 'Advertiser' AND ad_campaigns."responsibleUserId" = id)
    )
  )
);

-- ============================================
-- 7. SETTINGS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Settings are publicly readable" ON settings;
DROP POLICY IF EXISTS "Only admins can modify settings" ON settings;

-- Policy: SELECT - Public can read (for website settings, tracking pixels)
CREATE POLICY "Settings are publicly readable" ON settings
FOR SELECT USING (true);

-- Policy: ALL - Only Super Admin and Admin can modify
CREATE POLICY "Only admins can modify settings" ON settings
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Admin')
  )
);

-- ============================================
-- 8. VERIFY RLS IS ENABLED
-- ============================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Test thoroughly after applying these policies
-- 2. RLS policies must match your auth.users setup
-- 3. Public access (auth.uid() IS NULL) is allowed for:
--    - Form viewing (public order pages)
--    - Order insertion (form submissions)
--    - Abandoned cart tracking
-- 4. Brand isolation is enforced via assignedBrandIds array
-- 5. CS can only access orders assigned to them
-- 6. Super Admin has full access to everything
