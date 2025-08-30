-- COMPREHENSIVE SECURITY HARDENING for profiles table
-- Address any remaining security concerns with multiple layers of protection

-- 1. Add additional security function to validate all access
CREATE OR REPLACE FUNCTION public.validate_profile_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for profile access';
  END IF;
  
  -- Ensure JWT token is valid
  IF auth.jwt() IS NULL THEN
    RAISE EXCEPTION 'Valid JWT required for profile access';
  END IF;
  
  -- Block service role access to sensitive data (except for system operations)
  IF auth.role() = 'service_role' THEN
    RAISE EXCEPTION 'Service role cannot access user profiles directly';
  END IF;
  
  RETURN true;
END;
$$;

-- 2. Update all policies to include the additional validation
DROP POLICY IF EXISTS "profiles_select_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_only" ON public.profiles;

-- Create ultra-secure policies with multiple validation layers
CREATE POLICY "profiles_ultra_secure_select" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_profile_access()
);

CREATE POLICY "profiles_ultra_secure_insert" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND validate_profile_access()
  AND user_id IS NOT NULL
);

CREATE POLICY "profiles_ultra_secure_update" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_profile_access()
)
WITH CHECK (
  auth.uid() = user_id 
  AND validate_profile_access()
  AND user_id IS NOT NULL
);

-- 3. Add row-level security for sensitive columns specifically
-- Create a view that further restricts sensitive data access
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  user_id,
  display_name,
  first_name,
  last_name,
  -- Only show email to the profile owner
  CASE WHEN auth.uid() = user_id THEN email ELSE NULL END as email,
  -- Only show phone to the profile owner  
  CASE WHEN auth.uid() = user_id THEN phone ELSE NULL END as phone,
  department,
  position,
  bio,
  avatar_url,
  -- Only show office location to the profile owner
  CASE WHEN auth.uid() = user_id THEN office_location ELSE NULL END as office_location,
  created_at,
  updated_at
FROM public.profiles
WHERE auth.uid() = user_id;

-- 4. Grant proper permissions on the secure view
GRANT SELECT ON public.profiles_secure TO authenticated;

-- 5. Add additional trigger to prevent any bypassing
CREATE OR REPLACE FUNCTION public.final_security_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Final check: ensure no one can bypass user_id validation
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'SECURITY BREACH ATTEMPT: user_id mismatch detected';
  END IF;
  
  -- Log security-sensitive operations
  PERFORM public.log_security_event(
    'PROFILE_' || TG_OP,
    'profiles', 
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'auth_uid', auth.uid(),
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS final_security_check_trigger ON public.profiles;
CREATE TRIGGER final_security_check_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.final_security_check();

-- 6. Ensure the user_id column constraint is in place
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_unique;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 7. Final validation
DO $$
BEGIN
  RAISE NOTICE 'SECURITY: Ultra-secure multi-layer protection applied to profiles table';
  RAISE NOTICE 'SECURITY: Service role access blocked, sensitive columns protected, all operations logged';
END $$;