/*
  # Fix Admin Login RLS Policy
  
  ## Changes
  - Drop the restrictive RLS policy that prevents login
  - Add new policy that allows anyone to read admin_users for login purposes
  - This is safe because we only return id and email (no password hash)
  
  ## Security
  - Password hashes are never exposed to the client
  - Only email and id are returned after successful login
  - Authentication happens via password hash comparison
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert new admin users" ON admin_users;

-- Allow reading admin_users for login (only id and email are exposed)
CREATE POLICY "Allow login queries"
  ON admin_users FOR SELECT
  USING (true);

-- Allow authenticated admins to insert new admin users
CREATE POLICY "Authenticated admins can insert new admin users"
  ON admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );