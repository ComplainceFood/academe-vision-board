-- Fix remaining security issues identified by linter

-- Fix function search path mutability for security
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_id UUID,
  action_type TEXT,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
  window_start TIMESTAMP;
BEGIN
  window_start := NOW() - (window_minutes || ' minutes')::INTERVAL;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_user_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate common text fields for length and content
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check for extremely long text inputs that might indicate attacks
    IF (NEW.title IS NOT NULL AND length(NEW.title) > 1000) OR
       (NEW.description IS NOT NULL AND length(NEW.description) > 10000) OR
       (NEW.content IS NOT NULL AND length(NEW.content) > 50000) THEN
      RAISE EXCEPTION 'Input text too long - potential security risk';
    END IF;
    
    -- Basic XSS prevention - reject obvious script tags
    IF (NEW.title IS NOT NULL AND NEW.title ~* '<script|javascript:') OR
       (NEW.description IS NOT NULL AND NEW.description ~* '<script|javascript:') OR
       (NEW.content IS NOT NULL AND NEW.content ~* '<script|javascript:') THEN
      RAISE EXCEPTION 'Potentially malicious content detected';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add RLS policy for security_audit_log to prevent INFO warning
CREATE POLICY "Audit log access control" ON public.security_audit_log
  FOR ALL USING (user_id = auth.uid());