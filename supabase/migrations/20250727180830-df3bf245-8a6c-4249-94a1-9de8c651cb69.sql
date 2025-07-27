-- Safe extension cleanup - only move extensions that support schema changes
-- Exclude system extensions that don't support SET SCHEMA

DO $$
DECLARE
    ext_record RECORD;
    moveable_extensions TEXT[] := ARRAY['uuid-ossp', 'pgcrypto', 'citext', 'ltree', 'hstore'];
BEGIN
    -- Only move extensions that are known to support schema changes
    FOR ext_record IN 
        SELECT extname 
        FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE n.nspname = 'public'
        AND extname = ANY(moveable_extensions)
    LOOP
        -- Move extension to extensions schema
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
    END LOOP;
END
$$;

-- Ensure extensions schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;