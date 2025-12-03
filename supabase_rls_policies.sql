-- Supabase Row Level Security (RLS) Setup
-- Run this in Supabase SQL Editor to secure your database

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
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

-- Super Admin dan Admin dapat melihat semua orders
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin', 'Keuangan')
      AND status = 'Aktif'
    )
  );

-- CS dapat melihat orders yang di-assign ke mereka
CREATE POLICY "CS can view assigned orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'Customer service'
      AND status = 'Aktif'
    ) AND (
      "assignedCsId" = auth.uid()
    )
  );

-- Advertiser dapat melihat orders dari brand mereka
CREATE POLICY "Advertiser can view their brand orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'Advertiser'
      AND status = 'Aktif'
      AND "brandId" = ANY("assignedBrandIds")
    )
  );

-- Admin dapat insert orders
CREATE POLICY "Admin can insert orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- Admin dan CS dapat update orders
CREATE POLICY "Admin and CS can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin', 'Customer service')
      AND status = 'Aktif'
    )
  );

-- Hanya Super Admin yang dapat delete orders
CREATE POLICY "Super Admin can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'Super Admin'
      AND status = 'Aktif'
    )
  );

-- ============================================
-- 3. USERS TABLE POLICIES
-- ============================================

-- User dapat melihat profil mereka sendiri
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Admin dapat melihat semua users
CREATE POLICY "Admin can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- User dapat update profil mereka sendiri
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Admin dapat manage users
CREATE POLICY "Admin can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- ============================================
-- 4. FORMS TABLE POLICIES
-- ============================================

-- Public dapat melihat forms (untuk FormViewerPage)
CREATE POLICY "Public can view forms" ON forms
  FOR SELECT USING (true);

-- Admin dan Advertiser dapat create/edit forms
CREATE POLICY "Admin and Advertiser can manage forms" ON forms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin', 'Advertiser')
      AND status = 'Aktif'
    )
  );

-- ============================================
-- 5. ABANDONED_CARTS TABLE POLICIES
-- ============================================

-- Admin dan CS dapat melihat abandoned carts
CREATE POLICY "Admin and CS can view abandoned carts" ON abandoned_carts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin', 'Customer service')
      AND status = 'Aktif'
    )
  );

-- Public dapat insert abandoned cart (dari form)
CREATE POLICY "Public can insert abandoned carts" ON abandoned_carts
  FOR INSERT WITH CHECK (true);

-- Admin dan CS dapat update abandoned carts
CREATE POLICY "Admin and CS can update abandoned carts" ON abandoned_carts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin', 'Customer service')
      AND status = 'Aktif'
    )
  );

-- ============================================
-- 6. AD_CAMPAIGNS TABLE POLICIES
-- ============================================

-- Admin dan Advertiser dapat melihat campaigns
CREATE POLICY "Admin and Advertiser can view campaigns" ON ad_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin', 'Advertiser', 'Keuangan')
      AND status = 'Aktif'
    )
  );

-- Admin dan Advertiser dapat manage campaigns
CREATE POLICY "Admin and Advertiser can manage campaigns" ON ad_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin', 'Advertiser')
      AND status = 'Aktif'
    )
  );

-- ============================================
-- 7. SETTINGS TABLE POLICIES
-- ============================================

-- Public dapat membaca settings (untuk website branding)
CREATE POLICY "Public can read settings" ON settings
  FOR SELECT USING (true);

-- Hanya Super Admin yang dapat update settings
CREATE POLICY "Super Admin can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'Super Admin'
      AND status = 'Aktif'
    )
  );

-- ============================================
-- 8. VERIFY RLS IS ENABLED
-- ============================================

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'users', 'forms', 'abandoned_carts', 'ad_campaigns', 'settings');

-- Should all return rowsecurity = true
