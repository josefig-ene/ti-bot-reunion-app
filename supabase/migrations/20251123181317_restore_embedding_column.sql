/*
  # Restore Embedding Column

  1. Changes
    - Add back embedding column to knowledge_chunks table using extensions.vector type
    - Recreate vector index on embedding column

  2. Notes
    - The embedding column was accidentally removed during extension migration
    - Now using proper schema-qualified vector type from extensions schema
*/

-- Add embedding column back with extensions schema vector type
ALTER TABLE public.knowledge_chunks 
ADD COLUMN IF NOT EXISTS embedding extensions.vector(384);

-- Create index on embedding for vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
ON public.knowledge_chunks 
USING ivfflat (embedding extensions.vector_cosine_ops)
WITH (lists = 100);
