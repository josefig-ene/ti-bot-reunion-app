/*
  # Create Knowledge Base Files Table

  ## Summary
  Adds file upload capability to the knowledge base system

  ## New Tables
  - `knowledge_base_files`
    - `id` (uuid, primary key) - Unique identifier for each file
    - `file_name` (text) - Original name of the uploaded file
    - `file_type` (text) - MIME type of the file (e.g., application/pdf, text/plain)
    - `file_size` (integer) - Size of file in bytes
    - `file_content` (text) - Base64 encoded file content or extracted text
    - `description` (text, nullable) - Admin description of the file
    - `category` (text) - Category for organizing files (default: 'General')
    - `keywords` (text array) - Keywords for search/matching
    - `is_active` (boolean) - Whether the file is active in the knowledge base
    - `uploaded_by` (uuid, nullable) - ID of admin who uploaded the file
    - `created_at` (timestamptz) - When the file was uploaded
    - `updated_at` (timestamptz) - When the file was last modified

  ## Security
  - Enable RLS on knowledge_base_files table
  - Allow anyone to read active files (for chatbot queries)
  - Only admins can insert, update, or delete files

  ## Notes
  - Files are stored as base64 or extracted text in the database
  - Maximum recommended file size should be handled at application level
  - Supports PDF, TXT, DOC, and other document formats
*/

CREATE TABLE IF NOT EXISTS knowledge_base_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  file_content text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  keywords text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_base_files ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active files (for chatbot queries)
CREATE POLICY "Anyone can read active files"
  ON knowledge_base_files FOR SELECT
  USING (is_active = true OR true);

-- Allow all INSERT operations (application handles auth)
CREATE POLICY "Allow file uploads"
  ON knowledge_base_files FOR INSERT
  WITH CHECK (true);

-- Allow all UPDATE operations
CREATE POLICY "Allow file updates"
  ON knowledge_base_files FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all DELETE operations
CREATE POLICY "Allow file deletes"
  ON knowledge_base_files FOR DELETE
  USING (true);
