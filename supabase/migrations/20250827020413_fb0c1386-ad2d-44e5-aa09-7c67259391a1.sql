-- CRITICAL SECURITY FIXES - Phase 1: Data Protection

-- 1. Enhanced Profile Data Protection
-- Remove overly permissive system admin access to all profiles
DROP POLICY IF EXISTS "system_admins_can_view_all_profiles" ON public.profiles;

-- Add field-level restrictions for sensitive profile data
CREATE POLICY "authenticated_users_select_own_profile_enhanced" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(60)
  AND prevent_anonymous_access()
);

-- 2. Strengthen Financial Data Security
-- Add time-based session verification for funding sources
DROP POLICY IF EXISTS "authenticated_users_funding_sources_enhanced" ON public.funding_sources;

CREATE POLICY "funding_sources_secure_select_policy" 
ON public.funding_sources 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(30) -- Require recent authentication for financial data
  AND prevent_anonymous_access()
);

CREATE POLICY "funding_sources_secure_modify_policy" 
ON public.funding_sources 
FOR ALL 
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(15) -- Even stricter for modifications
  AND prevent_anonymous_access()
);

-- 3. Secure Calendar Integration Tokens
-- Add strict access controls for Google Calendar integration
CREATE POLICY "google_calendar_secure_access" 
ON public.google_calendar_integration 
FOR ALL 
USING (
  auth.uid() = user_id 
  AND auth.jwt() IS NOT NULL 
  AND is_authenticated_recently(30)
  AND prevent_anonymous_access()
);

-- Add strict access controls for Outlook integration
CREATE POLICY "outlook_integration_secure_access" 
ON public.outlook_integration 
FOR ALL 
USING (
  auth.uid() = user_id 
  AND auth.jwt() IS NOT NULL 
  AND is_authenticated_recently(30)
  AND prevent_anonymous_access()
);

-- 4. Enhance Funding Expenditures Security
CREATE POLICY "funding_expenditures_secure_access" 
ON public.funding_expenditures 
FOR ALL 
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(30)
  AND prevent_anonymous_access()
);

-- 5. Restrict Security Audit Log Access
-- Remove user access to their own audit logs for privacy
DROP POLICY IF EXISTS "users_view_own_audit_logs" ON public.security_audit_log;

-- Only system admins can view audit logs
CREATE POLICY "system_admins_only_audit_access" 
ON public.security_audit_log 
FOR SELECT 
USING (
  current_user_has_role('system_admin'::app_role)
  AND is_authenticated_recently(15)
  AND prevent_anonymous_access()
);

-- 6. Add Security Monitoring Function
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name TEXT,
  operation TEXT,
  record_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  -- Log access to sensitive financial and personal data
  IF table_name IN ('profiles', 'funding_sources', 'funding_expenditures', 'google_calendar_integration', 'outlook_integration') THEN
    PERFORM public.log_security_event(
      'SENSITIVE_DATA_ACCESS',
      table_name,
      NULL,
      jsonb_build_object(
        'operation', operation,
        'record_count', record_count,
        'user_id', auth.uid(),
        'timestamp', NOW()
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 7. Update remaining database functions with proper search path
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid DEFAULT auth.uid())
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role 
      WHEN 'system_admin' THEN 1 
      WHEN 'primary_user' THEN 2 
      WHEN 'secondary_user' THEN 3 
    END 
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;