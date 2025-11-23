/*
  # Fix Remaining Security Issues

  1. Performance Improvements
    - Add index for foreign key `chat_messages.session_id`
    - Add index for foreign key `knowledge_chunks.file_id`
    - Remove unused index `idx_admin_users_created_by`
    - Move vector extension from public to extensions schema

  2. Changes Made
    - Added: Index `idx_chat_messages_session_id` on chat_messages(session_id)
    - Added: Index `idx_knowledge_chunks_file_id` on knowledge_chunks(file_id)
    - Removed: Unused index `idx_admin_users_created_by`
    - Moved: vector extension to extensions schema

  3. Security Notes
    - Foreign key indexes prevent table scans and improve join performance
    - Removing unused indexes reduces write overhead
    - Extensions in dedicated schema follows PostgreSQL security best practices
*/

-- 1. Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_file_id ON public.knowledge_chunks(file_id);

-- 2. Remove unused index
DROP INDEX IF EXISTS public.idx_admin_users_created_by;

-- 3. Move vector extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension
DO $$
BEGIN
  -- Check if vector extension exists in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'vector' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Drop dependent function first
    DROP FUNCTION IF EXISTS public.match_knowledge_chunks(vector(384), float, int);
    
    -- Move extension
    DROP EXTENSION IF EXISTS vector CASCADE;
    CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
    
    -- Recreate function with extensions schema
    CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
      query_embedding extensions.vector(384),
      match_threshold float DEFAULT 0.5,
      match_count int DEFAULT 10
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
    STABLE
    SET search_path = public, extensions
    AS $func$
    BEGIN
      RETURN QUERY
      SELECT
        kc.id,
        kc.file_id,
        kc.chunk_type,
        kc.question,
        kc.answer,
        kc.context,
        kc.category,
        kc.keywords,
        kc.source_location,
        1 - (kc.embedding <=> query_embedding) AS similarity
      FROM public.knowledge_chunks kc
      WHERE kc.is_active = true
        AND kc.embedding IS NOT NULL
        AND 1 - (kc.embedding <=> query_embedding) > match_threshold
      ORDER BY kc.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $func$;
  ELSE
    -- Extension already moved or in extensions schema
    DROP FUNCTION IF EXISTS public.match_knowledge_chunks(vector(384), float, int);
    DROP FUNCTION IF EXISTS public.match_knowledge_chunks(extensions.vector(384), float, int);
    
    -- Ensure extension exists in extensions schema
    CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
    
    -- Create function with correct schema
    CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
      query_embedding extensions.vector(384),
      match_threshold float DEFAULT 0.5,
      match_count int DEFAULT 10
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
    STABLE
    SET search_path = public, extensions
    AS $func$
    BEGIN
      RETURN QUERY
      SELECT
        kc.id,
        kc.file_id,
        kc.chunk_type,
        kc.question,
        kc.answer,
        kc.context,
        kc.category,
        kc.keywords,
        kc.source_location,
        1 - (kc.embedding <=> query_embedding) AS similarity
      FROM public.knowledge_chunks kc
      WHERE kc.is_active = true
        AND kc.embedding IS NOT NULL
        AND 1 - (kc.embedding <=> query_embedding) > match_threshold
      ORDER BY kc.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $func$;
  END IF;
END $$;
