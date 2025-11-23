/*
  # Add CRUD Policies for Admin Users
  
  ## Changes
  - Add UPDATE policy for admin users (allows admins to update other admin accounts)
  - Add DELETE policy for admin users (allows admins to delete other admin accounts)
  
  ## Security
  - Only authenticated admins can perform these operations
  - Self-deletion is allowed but should be prevented at the application level
*/

-- Allow authenticated admins to update admin users
CREATE POLICY "Authenticated admins can update admin users"
  ON admin_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (
        SELECT id FROM admin_users 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
  )
  WITH CHECK (true);

-- Allow authenticated admins to delete admin users
CREATE POLICY "Authenticated admins can delete admin users"
  ON admin_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (
        SELECT id FROM admin_users 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
  );
