-- Fix trigger function causing event creation/import failures
-- The current validate_user_input() references NEW.content directly, which breaks for tables without a `content` column (e.g., planning_events), raising: record "new" has no field "content".
-- This migration safely accesses fields via to_jsonb(NEW) so missing keys return NULL.

CREATE OR REPLACE FUNCTION public.validate_user_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_description text;
  v_content text; -- may be NULL for tables without this column
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Safely read fields; non-existent keys return NULL
    v_title := to_jsonb(NEW)->>'title';
    v_description := to_jsonb(NEW)->>'description';
    v_content := to_jsonb(NEW)->>'content';

    -- Length checks
    IF (v_title IS NOT NULL AND length(v_title) > 1000)
       OR (v_description IS NOT NULL AND length(v_description) > 10000)
       OR (v_content IS NOT NULL AND length(v_content) > 50000) THEN
      RAISE EXCEPTION 'Input text too long - potential security risk';
    END IF;

    -- Basic XSS prevention - reject obvious script tags
    IF (v_title IS NOT NULL AND v_title ~* '<script|javascript:')
       OR (v_description IS NOT NULL AND v_description ~* '<script|javascript:')
       OR (v_content IS NOT NULL AND v_content ~* '<script|javascript:') THEN
      RAISE EXCEPTION 'Potentially malicious content detected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;