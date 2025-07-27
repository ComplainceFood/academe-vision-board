-- Complete extension security cleanup
-- Ensure all extensions are properly isolated from public schema

-- Check for any remaining extension references and clean them up
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    -- List all extensions in public schema and move them
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

-- Ensure extensions schema has proper permissions
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Update search_path to include extensions schema for functions that might need it
-- This ensures compatibility while maintaining security
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;