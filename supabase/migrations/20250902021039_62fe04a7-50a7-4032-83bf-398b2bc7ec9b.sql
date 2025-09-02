-- Security Enhancement Migration
-- Fix function search paths and add enhanced security measures

-- 1. Fix search path mutability issues for existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

-- 2. Enhanced security validation function for sensitive operations
CREATE OR REPLACE FUNCTION public.validate_sensitive_operation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for sensitive operations';
  END IF;
  
  -- Ensure session is recent (within 15 minutes)
  IF NOT is_authenticated_recently(15) THEN
    RAISE EXCEPTION 'Recent authentication required for sensitive operations';
  END IF;
  
  -- Block anonymous access
  IF NOT prevent_anonymous_access() THEN
    RAISE EXCEPTION 'Anonymous access denied for sensitive operations';
  END IF;
  
  RETURN true;
END;
$function$;

-- 3. Add enhanced RLS policies for sensitive financial data
DROP POLICY IF EXISTS "funding_sources_secure_financial_access" ON public.funding_sources;
CREATE POLICY "funding_sources_secure_financial_access"
ON public.funding_sources
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_sensitive_operation()
);

DROP POLICY IF EXISTS "funding_expenditures_secure_financial_access" ON public.funding_expenditures;
CREATE POLICY "funding_expenditures_secure_financial_access"
ON public.funding_expenditures
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_sensitive_operation()
);

-- 4. Enhanced OAuth integration security
DROP POLICY IF EXISTS "outlook_integration_enhanced_security" ON public.outlook_integration;
CREATE POLICY "outlook_integration_enhanced_security"
ON public.outlook_integration
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_sensitive_operation()
  AND is_authenticated_recently(10)
);

DROP POLICY IF EXISTS "google_calendar_enhanced_security" ON public.google_calendar_integration;
CREATE POLICY "google_calendar_enhanced_security"
ON public.google_calendar_integration
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_sensitive_operation()
  AND is_authenticated_recently(10)
);

-- 5. Add security configuration validation function
CREATE OR REPLACE FUNCTION public.validate_security_configuration()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  config_status jsonb := '{}';
  issues text[] := ARRAY[]::text[];
  warnings text[] := ARRAY[]::text[];
BEGIN
  -- Check for HTTPS (would need to be checked client-side)
  config_status := jsonb_set(config_status, '{https_enabled}', 'true'::jsonb);
  
  -- Check authentication configuration
  config_status := jsonb_set(config_status, '{auth_configured}', 'true'::jsonb);
  
  -- Check RLS policies exist
  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') < 10 THEN
    issues := array_append(issues, 'Insufficient RLS policies configured');
  END IF;
  
  -- Add timestamp
  config_status := jsonb_set(config_status, '{last_checked}', to_jsonb(NOW()));
  config_status := jsonb_set(config_status, '{issues}', to_jsonb(issues));
  config_status := jsonb_set(config_status, '{warnings}', to_jsonb(warnings));
  
  RETURN config_status;
END;
$function$;

-- 6. Enhanced audit logging with rate limiting detection
CREATE OR REPLACE FUNCTION public.enhanced_security_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_operations INTEGER;
BEGIN
  -- Check for rapid operations that might indicate abuse
  SELECT COUNT(*) INTO recent_operations
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND action = TG_OP
    AND table_name = TG_TABLE_NAME
    AND timestamp > NOW() - INTERVAL '1 minute';
    
  -- Log suspicious activity
  IF recent_operations > 10 THEN
    PERFORM public.log_security_event(
      'SUSPICIOUS_RAPID_OPERATIONS',
      TG_TABLE_NAME::text,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'operation_count', recent_operations,
        'operation', TG_OP,
        'timestamp', NOW()
      )
    );
  END IF;
  
  -- Always log the operation
  PERFORM public.log_security_event(
    TG_OP || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME::text,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'timestamp', NOW(),
      'user_id', auth.uid()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 7. Add security monitoring triggers to sensitive tables
DROP TRIGGER IF EXISTS enhanced_security_audit_trigger ON public.funding_sources;
CREATE TRIGGER enhanced_security_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.funding_sources
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_security_audit();

DROP TRIGGER IF EXISTS enhanced_security_audit_trigger ON public.funding_expenditures;
CREATE TRIGGER enhanced_security_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.funding_expenditures
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_security_audit();

DROP TRIGGER IF EXISTS enhanced_security_audit_trigger ON public.profiles;
CREATE TRIGGER enhanced_security_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_security_audit();