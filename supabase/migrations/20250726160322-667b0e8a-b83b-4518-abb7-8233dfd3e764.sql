-- Fix extension security issue by moving extensions out of public schema
-- First, create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move uuid extension to extensions schema if it exists in public
DO $$
BEGIN
    -- Check if uuid_generate_v4 function exists in public schema
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'uuid_generate_v4'
    ) THEN
        -- Drop the extension from public and recreate in extensions schema
        DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
        
        -- Grant usage on the extensions schema to necessary roles
        GRANT USAGE ON SCHEMA extensions TO public;
        GRANT USAGE ON SCHEMA extensions TO authenticated;
        GRANT USAGE ON SCHEMA extensions TO anon;
    END IF;
END
$$;

-- Update any table defaults that might reference the old public schema functions
-- Check and update supplies table if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'supplies' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.supplies ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END
$$;

-- Check and update meetings table if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meetings' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.meetings ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END
$$;

-- Check and update notes table if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.notes ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END
$$;

-- Check and update expenses table if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid_generate_v4%'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.expenses ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END
$$;