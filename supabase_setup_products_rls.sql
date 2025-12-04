-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin can view all products
CREATE POLICY "super_admin_view_products" ON products
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 2: Super Admin can insert products
CREATE POLICY "super_admin_insert_products" ON products
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 3: Super Admin can update products
CREATE POLICY "super_admin_update_products" ON products
FOR UPDATE
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

-- Policy 4: Super Admin can delete products
CREATE POLICY "super_admin_delete_products" ON products
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 5: Admin can view products they own (by brand_id)
CREATE POLICY "admin_view_own_products" ON products
FOR SELECT
USING (
    brand_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 6: Admin can insert products for their brand
CREATE POLICY "admin_insert_own_products" ON products
FOR INSERT
WITH CHECK (
    brand_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 7: Admin can update their own products
CREATE POLICY "admin_update_own_products" ON products
FOR UPDATE
USING (
    brand_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
)
WITH CHECK (
    brand_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 8: Admin can delete their own products
CREATE POLICY "admin_delete_own_products" ON products
FOR DELETE
USING (
    brand_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Super Admin'
    )
);

-- Policy 9: All authenticated users can view products (for public forms)
CREATE POLICY "authenticated_view_products" ON products
FOR SELECT
USING (
    auth.role() = 'authenticated'
);

-- Policy 10: Advertisers can view products for their forms
CREATE POLICY "advertiser_view_products" ON products
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Advertiser'
    )
);
