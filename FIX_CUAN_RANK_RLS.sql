-- Fix: Allow Admin and other roles to update settings table (specifically cuanRank)
-- Run this in Supabase SQL Editor

-- Drop existing policy that only allows Super Admin
DROP POLICY IF EXISTS "Super Admin can update settings" ON settings;

-- Create new policy that allows Super Admin and Admin to update settings
CREATE POLICY "Admin and Super Admin can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- Also need to allow INSERT for new settings records
DROP POLICY IF EXISTS "Super Admin can insert settings" ON settings;

CREATE POLICY "Admin and Super Admin can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );

-- Optional: Allow delete as well
DROP POLICY IF EXISTS "Super Admin can delete settings" ON settings;

CREATE POLICY "Admin and Super Admin can delete settings" ON settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Admin')
      AND status = 'Aktif'
    )
  );
