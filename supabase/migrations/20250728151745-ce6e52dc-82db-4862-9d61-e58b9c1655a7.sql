-- Fix the security definer view issue by removing the problematic view
-- and create a secure alternative

DROP VIEW IF EXISTS public.extension_security_status;

-- Create a secure function instead of a view to check extension security
CREATE OR REPLACE FUNCTION public.get_extension_security_info()
RETURNS TABLE (
  extension_name TEXT,
  schema_name TEXT,
  security_status TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.extname::TEXT as extension_name,
    n.nspname::TEXT as schema_name,
    CASE 
      WHEN n.nspname = 'public' THEN 'SECURITY_RISK'
      WHEN n.nspname = 'extensions' THEN 'SECURE'
      ELSE 'UNKNOWN'
    END::TEXT as security_status,
    'Extensions in public schema pose security risks'::TEXT as recommendation
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname IN ('public', 'extensions');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Add proper RLS policy for the extension security function access
-- (This addresses the INFO warning about RLS enabled but no policy)
CREATE POLICY "Extension security info access" ON public.security_audit_log
  FOR ALL USING (user_id = auth.uid());