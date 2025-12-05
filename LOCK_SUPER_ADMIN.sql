-- LOCK SUPER ADMIN PROTECTION
-- Ensure only ONE Super Admin exists: galuhmediautama@gmail.com
-- Prevents any user from creating, modifying, or deleting Super Admin role

-- ============================================
-- 1. DATABASE TRIGGER: Prevent Super Admin Role Changes
-- ============================================

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS protect_super_admin_role ON users;
DROP FUNCTION IF EXISTS prevent_super_admin_changes();

-- Create function to protect Super Admin
CREATE OR REPLACE FUNCTION prevent_super_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- RULE 1: Prevent creating NEW Super Admin (other than galuhmediautama@gmail.com)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.role = 'Super Admin' AND NEW.email != 'galuhmediautama@gmail.com' THEN
            RAISE EXCEPTION 'FORBIDDEN: Only galuhmediautama@gmail.com can have Super Admin role';
        END IF;
    END IF;

    -- RULE 2: Prevent modifying existing Super Admin account
    IF TG_OP = 'UPDATE' AND OLD.email = 'galuhmediautama@gmail.com' THEN
        -- Allow only status changes (for login control), but NOT role/email changes
        IF NEW.email != OLD.email THEN
            RAISE EXCEPTION 'FORBIDDEN: Cannot change Super Admin email address';
        END IF;
        IF NEW.role != OLD.role THEN
            RAISE EXCEPTION 'FORBIDDEN: Cannot change Super Admin role';
        END IF;
    END IF;

    -- RULE 3: Prevent deleting Super Admin
    IF TG_OP = 'DELETE' AND OLD.email = 'galuhmediautama@gmail.com' THEN
        RAISE EXCEPTION 'FORBIDDEN: Cannot delete Super Admin account';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER protect_super_admin_role
BEFORE INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_super_admin_changes();

-- ============================================
-- 2. RLS POLICY: Additional Protection Layer
-- ============================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Prevent Super Admin role assignment" ON users;

-- Create RLS policy to block Super Admin role for non-super-admin users
CREATE POLICY "Prevent Super Admin role assignment" ON users
  FOR UPDATE USING (
    -- Only allow Super Admin to modify Super Admin role
    CASE 
      WHEN role = 'Super Admin' THEN 
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = (select auth.uid())
          AND email = 'galuhmediautama@gmail.com'
          AND role = 'Super Admin'
        )
      ELSE true
    END
  )
  WITH CHECK (
    -- Block creating Super Admin unless it's galuhmediautama@gmail.com
    CASE 
      WHEN role = 'Super Admin' THEN email = 'galuhmediautama@gmail.com'
      ELSE true
    END
  );

-- ============================================
-- 3. VERIFICATION: Check Super Admin Protection
-- ============================================

-- Count Super Admins (should be exactly 1)
SELECT 
    COUNT(*) as super_admin_count,
    string_agg(email, ', ') as super_admin_emails
FROM users 
WHERE role = 'Super Admin';

-- Expected output:
-- super_admin_count | super_admin_emails
-- 1                 | galuhmediautama@gmail.com

-- ============================================
-- 4. FORCE FIX: If multiple Super Admins exist
-- ============================================

-- Uncomment and run ONLY if you need to fix existing data:
-- UPDATE users 
-- SET role = 'Admin' 
-- WHERE role = 'Super Admin' 
-- AND email != 'galuhmediautama@gmail.com';

-- ============================================
-- 5. TEST CASES (For verification after deployment)
-- ============================================

-- Test 1: Try to create new Super Admin (should FAIL)
-- INSERT INTO users (id, email, name, role, status) 
-- VALUES (gen_random_uuid(), 'fake@test.com', 'Fake Admin', 'Super Admin', 'Aktif');
-- Expected: ERROR: FORBIDDEN: Only galuhmediautama@gmail.com can have Super Admin role

-- Test 2: Try to change existing user to Super Admin (should FAIL)
-- UPDATE users SET role = 'Super Admin' WHERE email = 'someuser@example.com';
-- Expected: ERROR: FORBIDDEN: Only galuhmediautama@gmail.com can have Super Admin role

-- Test 3: Try to change Super Admin email (should FAIL)
-- UPDATE users SET email = 'newemail@test.com' WHERE email = 'galuhmediautama@gmail.com';
-- Expected: ERROR: FORBIDDEN: Cannot change Super Admin email address

-- Test 4: Try to delete Super Admin (should FAIL)
-- DELETE FROM users WHERE email = 'galuhmediautama@gmail.com';
-- Expected: ERROR: FORBIDDEN: Cannot delete Super Admin account

-- Test 5: Normal operations should still work (should SUCCESS)
-- UPDATE users SET name = 'Updated Name' WHERE email = 'regularuser@test.com';
-- UPDATE users SET status = 'Tidak Aktif' WHERE email = 'galuhmediautama@gmail.com';
-- Expected: SUCCESS

COMMENT ON TRIGGER protect_super_admin_role ON users IS 
'Protects Super Admin role: only galuhmediautama@gmail.com can be Super Admin. Prevents role changes, email changes, and deletion of Super Admin account.';
