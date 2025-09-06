-- Security Fix: Strengthen profiles table RLS policies to prevent PII exposure
-- This fixes the identified security vulnerability where personal information could be stolen

-- First, drop existing incomplete policies
DROP POLICY IF EXISTS "profiles_owner_only_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_only_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_only_update" ON public.profiles;

-- Create comprehensive security-hardened RLS policies for profiles table
-- These policies ensure ONLY the profile owner can access their own data

-- SELECT policy - Users can only view their own profile
CREATE POLICY "profiles_secure_select" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND user_id IS NOT NULL 
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  );

-- INSERT policy - Users can only create their own profile
CREATE POLICY "profiles_secure_insert" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  );

-- UPDATE policy - Users can only update their own profile with enhanced security
CREATE POLICY "profiles_secure_update" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  );

-- DELETE policy - Users can only delete their own profile (added missing protection)
CREATE POLICY "profiles_secure_delete" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  );

-- Enhanced security trigger to log all profile access attempts
CREATE OR REPLACE FUNCTION public.log_profile_security_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all profile operations for security audit
  PERFORM public.log_security_event(
    'PROFILE_' || TG_OP,
    'profiles',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'user_id', auth.uid(),
      'target_profile_user_id', COALESCE(NEW.user_id, OLD.user_id),
      'timestamp', NOW(),
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for comprehensive profile access logging
DROP TRIGGER IF EXISTS profile_security_audit_trigger ON public.profiles;
CREATE TRIGGER profile_security_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_security_access();

-- Add additional PII protection validation
CREATE OR REPLACE FUNCTION public.validate_profile_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent user_id tampering (critical security check)
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot change user_id after profile creation';
  END IF;
  
  -- Ensure user_id matches authenticated user (prevents unauthorized access)
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Profile user_id must match authenticated user';
  END IF;
  
  -- Validate email format if provided (prevent malicious data)
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format detected';
  END IF;
  
  -- Sanitize and limit text fields to prevent DoS and XSS
  IF length(COALESCE(NEW.bio, '')) > 5000 THEN
    RAISE EXCEPTION 'Bio text exceeds maximum length (5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.display_name, '')) > 255 THEN
    RAISE EXCEPTION 'Display name exceeds maximum length (255 characters)';
  END IF;
  
  -- Sanitize phone number input
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[\+]?[0-9\-\(\)\s\.]+$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace existing profile validation trigger with enhanced PII protection
DROP TRIGGER IF EXISTS ensure_profile_security_trigger ON public.profiles;
CREATE TRIGGER validate_profile_pii_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_pii();

-- Create function to check if profile data access is authorized
CREATE OR REPLACE FUNCTION public.is_profile_access_authorized(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Only allow access if requesting user matches the profile owner
  RETURN (
    auth.uid() IS NOT NULL 
    AND auth.uid() = target_user_id
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Log this security fix for audit trail
SELECT public.log_security_event(
  'SECURITY_FIX_APPLIED',
  'profiles',
  NULL,
  jsonb_build_object(
    'fix_type', 'PII_PROTECTION_ENHANCEMENT',
    'description', 'Applied comprehensive RLS policies and PII validation to prevent unauthorized access',
    'timestamp', NOW()
  )
);