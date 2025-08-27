-- Fix search path issues for all functions
CREATE OR REPLACE FUNCTION public.is_authenticated_recently(minutes_threshold INTEGER DEFAULT 60)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is authenticated and session is recent
  RETURN (
    auth.uid() IS NOT NULL 
    AND auth.jwt() IS NOT NULL 
    AND (auth.jwt() ->> 'iat')::bigint > EXTRACT(EPOCH FROM NOW() - INTERVAL '1 minute' * minutes_threshold)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.prevent_anonymous_access()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.role() = 'anon' THEN
    RAISE EXCEPTION 'Anonymous access to sensitive data is not allowed';
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';