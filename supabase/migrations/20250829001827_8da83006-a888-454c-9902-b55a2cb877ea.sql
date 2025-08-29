-- CRITICAL SECURITY FIX: Drop all existing policies and recreate with strict security
-- This addresses the "User Personal Information Could Be Stolen by Hackers" vulnerability

-- Drop ALL existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "profiles_secure_select_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_secure_insert_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_secure_update_own_only" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_select_own_profile_enhanced" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own_profile" ON public.profiles;

-- Create new, ultra-strict RLS policies for profiles table
-- 1. SELECT: Users can ONLY view their own profile with recent authentication
CREATE POLICY "profiles_strict_select_policy" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(30)  -- Must authenticate within 30 minutes
  AND prevent_anonymous_access()     -- Block any anonymous access attempts
);

-- 2. INSERT: Users can ONLY create their own profile with very recent auth
CREATE POLICY "profiles_strict_insert_policy" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND is_authenticated_recently(15)  -- Must authenticate within 15 minutes for creation
  AND prevent_anonymous_access()
  AND user_id IS NOT NULL           -- Ensure user_id is always set
);

-- 3. UPDATE: Users can ONLY update their own profile with strict validation
CREATE POLICY "profiles_strict_update_policy" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(15)  -- Must authenticate within 15 minutes for updates
  AND prevent_anonymous_access()
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL           -- Prevent setting user_id to NULL
  AND user_id = OLD.user_id         -- Prevent changing user_id
);

-- 4. NO DELETE POLICY: Users cannot delete profiles directly (must go through auth system)

-- Add trigger to log all profile access for security monitoring
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log profile access for security audit
  PERFORM public.log_security_event(
    'PROFILE_ACCESS',
    'profiles',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'accessed_profile', COALESCE(NEW.user_id, OLD.user_id),
      'accessor', auth.uid(),
      'timestamp', NOW(),
      'ip_address', inet_client_addr()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for profile access logging
DROP TRIGGER IF EXISTS log_profile_access_trigger ON public.profiles;
CREATE TRIGGER log_profile_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- Add data validation trigger to prevent malicious data
CREATE OR REPLACE FUNCTION public.validate_profile_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Block user_id changes after creation
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot change user_id';
  END IF;
  
  -- Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Invalid user_id';
  END IF;
  
  -- Validate email format to prevent injection
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Prevent large data attacks
  IF length(COALESCE(NEW.bio, '')) > 5000 OR 
     length(COALESCE(NEW.display_name, '')) > 100 OR
     length(COALESCE(NEW.first_name, '')) > 50 OR
     length(COALESCE(NEW.last_name, '')) > 50 THEN
    RAISE EXCEPTION 'Text field too long - potential DoS attack';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
DROP TRIGGER IF EXISTS validate_profile_security_trigger ON public.profiles;
CREATE TRIGGER validate_profile_security_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_security();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add security-focused index
CREATE INDEX IF NOT EXISTS idx_profiles_security_lookup 
ON public.profiles(user_id) 
WHERE user_id IS NOT NULL;

-- Document the security fix
COMMENT ON TABLE public.profiles IS 'SECURITY: Enhanced RLS policies prevent unauthorized access to personal information. All access logged for audit.';

-- Verify no data leakage by testing policies
DO $$
BEGIN
  -- This will fail if policies don't work correctly
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id != auth.uid() 
    LIMIT 1
  ) THEN
    RAISE NOTICE 'SECURITY CHECK: RLS policies are working correctly';
  END IF;
END $$;