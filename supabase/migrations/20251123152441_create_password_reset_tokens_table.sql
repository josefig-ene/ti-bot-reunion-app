/*
  # Create Password Reset Tokens Table

  ## Summary
  Adds password reset functionality for admin users who have forgotten their passwords

  ## New Tables
  - `password_reset_tokens`
    - `id` (uuid, primary key) - Unique identifier for each token
    - `admin_email` (text) - Email of the admin requesting reset
    - `reset_token` (text, unique) - Unique token for password reset
    - `expires_at` (timestamptz) - Token expiration time (15 minutes)
    - `used` (boolean) - Whether token has been used
    - `created_at` (timestamptz) - When the token was created

  ## Security
  - Enable RLS on password_reset_tokens table
  - Allow anyone to create reset tokens (for forgot password flow)
  - Allow reading tokens for validation
  - Tokens expire after 15 minutes
  - Tokens can only be used once

  ## Notes
  - Application handles validation and email sending
  - Old tokens are automatically invalidated after use
  - This is a simplified reset flow without email integration
*/

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  reset_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create reset tokens
CREATE POLICY "Allow creating reset tokens"
  ON password_reset_tokens FOR INSERT
  WITH CHECK (true);

-- Allow reading reset tokens for validation
CREATE POLICY "Allow reading reset tokens"
  ON password_reset_tokens FOR SELECT
  USING (true);

-- Allow updating tokens (marking as used)
CREATE POLICY "Allow updating reset tokens"
  ON password_reset_tokens FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(reset_token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON password_reset_tokens(admin_email);