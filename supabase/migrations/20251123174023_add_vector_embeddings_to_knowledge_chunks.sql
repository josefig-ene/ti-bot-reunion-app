/*
  # Add Vector Embeddings for RAG Implementation

  ## Summary
  Enables Retrieval-Augmented Generation (RAG) by adding vector embeddings to knowledge chunks.
  Uses pgvector extension for semantic similarity search.

  ## Changes
  1. Enable vector extension
  2. Add embedding column to knowledge_chunks table (384 dimensions for gte-small model)
  3. Create vector similarity search index using HNSW
  4. Add helper function for similarity search

  ## Notes
  - Uses gte-small embedding model (384 dimensions) available in Supabase Edge Functions
  - HNSW index provides fast approximate nearest neighbor search
  - Cosine distance metric is optimal for normalized embeddings
*/

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge_chunks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_chunks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
  ON knowledge_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  chunk_type text,
  question text,
  answer text,
  context text,
  category text,
  keywords text[],
  source_location text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.file_id,
    knowledge_chunks.chunk_type,
    knowledge_chunks.question,
    knowledge_chunks.answer,
    knowledge_chunks.context,
    knowledge_chunks.category,
    knowledge_chunks.keywords,
    knowledge_chunks.source_location,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks
  WHERE knowledge_chunks.is_active = true
    AND knowledge_chunks.embedding IS NOT NULL
    AND 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
