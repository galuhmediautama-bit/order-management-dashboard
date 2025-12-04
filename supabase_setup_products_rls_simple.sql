-- Simplified RLS Policies untuk Products Table
-- Jalankan ini setelah drop policies lama

-- IMPORTANT: Drop existing policies terlebih dahulu
DROP POLICY IF EXISTS "super_admin_view_products" ON products;
DROP POLICY IF EXISTS "super_admin_insert_products" ON products;
DROP POLICY IF EXISTS "super_admin_update_products" ON products;
DROP POLICY IF EXISTS "super_admin_delete_products" ON products;
DROP POLICY IF EXISTS "admin_view_own_products" ON products;
DROP POLICY IF EXISTS "admin_insert_own_products" ON products;
DROP POLICY IF EXISTS "admin_update_own_products" ON products;
DROP POLICY IF EXISTS "admin_delete_own_products" ON products;
DROP POLICY IF EXISTS "authenticated_view_products" ON products;
DROP POLICY IF EXISTS "advertiser_view_products" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can view products (for forms)
CREATE POLICY "view_products" ON products
FOR SELECT
USING (true);

-- Policy 2: Super Admin can do everything
CREATE POLICY "super_admin_all" ON products
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 3: Admin (brand owners) can manage their own products
CREATE POLICY "admin_manage_own_products" ON products
FOR ALL
USING (
    -- View own products OR is Super Admin
    brand_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
)
WITH CHECK (
    -- Create/Edit/Delete untuk brand sendiri OR is Super Admin
    brand_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);
