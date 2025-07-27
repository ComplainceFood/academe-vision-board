-- Move extensions to secure extensions schema for better security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move all extensions from public schema to extensions schema
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    -- Get all extensions currently in public schema
    FOR ext_record IN 
        SELECT extname 
        FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE n.nspname = 'public'
    LOOP
        -- Move each extension to extensions schema
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
    END LOOP;
END
$$;

-- Ensure proper permissions on extensions schema
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;