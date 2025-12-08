-- FIX: Allow Admin and Super Admin to update any user's assignedBrandIds

-- Drop old restrictive policy
DROP POLICY IF EXISTS users_update_self ON users;

-- Create new policy: Users can update themselves
CREATE POLICY users_update_self ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create new policy: Admin and Super Admin can update anyone
CREATE POLICY users_update_by_admin ON users
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('Admin', 'Super Admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('Admin', 'Super Admin')
    )
);

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'UPDATE'
ORDER BY policyname;
