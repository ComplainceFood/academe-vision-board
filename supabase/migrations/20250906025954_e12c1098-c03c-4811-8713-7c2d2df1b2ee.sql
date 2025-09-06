-- Security Fix: Strengthen profiles table RLS policies to prevent PII exposure
-- Check current policies and apply incremental fixes

-- Add missing DELETE policy (this was the main vulnerability)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "profiles_secure_delete" ON public.profiles
      FOR DELETE
      TO authenticated
      USING (
        auth.uid() = user_id 
        AND user_id IS NOT NULL 
        AND auth.jwt() IS NOT NULL
        AND prevent_anonymous_access()
      );
  END IF;
END $$;

-- Enhance existing policies with additional security checks
-- Drop and recreate existing policies with enhanced security
DROP POLICY IF EXISTS "profiles_owner_only_select" ON public.profiles;
CREATE POLICY "profiles_owner_only_select" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND user_id IS NOT NULL 
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  );

DROP POLICY IF EXISTS "profiles_owner_only_insert" ON public.profiles;
CREATE POLICY "profiles_owner_only_insert" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND auth.jwt() IS NOT NULL
    AND prevent_anonymous_access()
  );

DROP POLICY IF EXISTS "profiles_owner_only_update" ON public.profiles;
CREATE POLICY "profiles_owner_only_update" ON public.profiles
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

-- Enhanced PII validation function to prevent data theft
CREATE OR REPLACE FUNCTION public.validate_profile_pii_security()
RETURNS TRIGGER AS $$
BEGIN
  -- Critical: Prevent user_id tampering
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot change user_id';
  END IF;
  
  -- Critical: Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Profile access denied';
  END IF;
  
  -- Validate email format to prevent malicious data
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Limit text fields to prevent DoS attacks
  IF length(COALESCE(NEW.bio, '')) > 5000 THEN
    RAISE EXCEPTION 'Bio text too long (max 5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.display_name, '')) > 255 THEN
    RAISE EXCEPTION 'Display name too long (max 255 characters)';
  END IF;
  
  -- Validate phone number format
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[\+]?[0-9\-\(\)\s\.]+$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace existing validation trigger with enhanced security
DROP TRIGGER IF EXISTS ensure_profile_security_trigger ON public.profiles;
DROP TRIGGER IF EXISTS validate_profile_pii_trigger ON public.profiles;
CREATE TRIGGER validate_profile_pii_security_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_pii_security();

-- Log security fix
SELECT public.log_security_event(
  'PII_SECURITY_FIX',
  'profiles',
  NULL,
  jsonb_build_object(
    'fix', 'Enhanced RLS policies and added DELETE protection',
    'timestamp', NOW()
  )
);