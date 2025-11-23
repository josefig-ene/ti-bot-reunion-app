/*
  # Simplify Admin Users RLS Policies
  
  ## Changes
  - Replace complex RLS policies with simpler ones
  - Allow UPDATE and DELETE operations on admin_users table
  
  ## Security Note
  - Using custom authentication (not Supabase Auth)
  - Application-level checks prevent self-deletion and unauthorized access
  - Policies allow operations but application logic enforces business rules
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Authenticated admins can delete admin users" ON admin_users;

-- Allow UPDATE operations
CREATE POLICY "Allow admin updates"
  ON admin_users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE operations  
CREATE POLICY "Allow admin deletes"
  ON admin_users FOR DELETE
  USING (true);
