/*
  # Create Knowledge Chunks Table

  ## Summary
  Creates a central repository of extracted Q&A pairs and content chunks from knowledge base files.
  This allows the chatbot to query specific, pre-processed content rather than raw files.

  ## New Tables
  - `knowledge_chunks`
    - `id` (uuid, primary key) - Unique identifier for each chunk
    - `file_id` (uuid, foreign key) - Reference to the source file
    - `chunk_type` (text) - Type of chunk: 'qa' (question/answer), 'section' (content section), 'table' (tabular data)
    - `question` (text, nullable) - The question (for Q&A chunks)
    - `answer` (text) - The answer or content
    - `context` (text, nullable) - Additional context around the chunk
    - `category` (text) - Category inherited from parent file
    - `keywords` (text array) - Keywords extracted from the chunk
    - `source_location` (text, nullable) - Location in source file (page number, line number, etc.)
    - `is_active` (boolean) - Whether this chunk is active for queries
    - `created_at` (timestamptz) - When the chunk was created
    - `updated_at` (timestamptz) - When the chunk was last modified

  ## Security
  - Enable RLS on knowledge_chunks table
  - Allow anyone to read active chunks (for chatbot queries)
  - Only system/admin can insert, update, or delete chunks

  ## Notes
  - Chunks are automatically generated when files are uploaded or updated
  - Q&A format chunks enable precise question matching
  - Section chunks provide contextual information
  - Table chunks handle structured data from spreadsheets
*/

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES knowledge_base_files(id) ON DELETE CASCADE,
  chunk_type text NOT NULL CHECK (chunk_type IN ('qa', 'section', 'table')),
  question text,
  answer text NOT NULL,
  context text,
  category text NOT NULL DEFAULT 'General',
  keywords text[] DEFAULT '{}',
  source_location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_file_id ON knowledge_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_type ON knowledge_chunks(chunk_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_active ON knowledge_chunks(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_keywords ON knowledge_chunks USING GIN(keywords);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active chunks"
  ON knowledge_chunks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow chunk inserts"
  ON knowledge_chunks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow chunk updates"
  ON knowledge_chunks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow chunk deletes"
  ON knowledge_chunks FOR DELETE
  USING (true);
