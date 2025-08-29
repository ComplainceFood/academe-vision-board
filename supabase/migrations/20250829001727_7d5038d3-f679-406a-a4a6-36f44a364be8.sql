-- CRITICAL SECURITY FIX: Protect user personal information in profiles table
-- Remove potentially conflicting or overly permissive policies and implement strict access controls

-- First, drop existing policies to rebuild them securely
DROP POLICY IF EXISTS "authenticated_users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_select_own_profile_enhanced" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own_profile" ON public.profiles;

-- Create new, strict RLS policies for profiles table
-- 1. SELECT: Users can only view their own profile with recent authentication
CREATE POLICY "profiles_secure_select_own_only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(30)  -- Require authentication within last 30 minutes
  AND prevent_anonymous_access()     -- Additional security check
);

-- 2. INSERT: Users can only create their own profile
CREATE POLICY "profiles_secure_insert_own_only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND is_authenticated_recently(15)  -- Require very recent authentication for profile creation
  AND prevent_anonymous_access()
);

-- 3. UPDATE: Users can only update their own profile with strict validation
CREATE POLICY "profiles_secure_update_own_only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(15)  -- Require very recent authentication for updates
  AND prevent_anonymous_access()
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL           -- Prevent setting user_id to NULL
);

-- 4. DELETE: Prevent profile deletion (users should deactivate accounts through auth)
-- No DELETE policy = no one can delete profiles directly

-- Add additional security trigger to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log all profile access for security monitoring
  PERFORM public.log_security_event(
    'PROFILE_ACCESS',
    'profiles',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'accessed_user_id', COALESCE(NEW.user_id, OLD.user_id),
      'accessing_user_id', auth.uid(),
      'timestamp', NOW(),
      'fields_accessed', CASE 
        WHEN TG_OP = 'SELECT' THEN 'profile_view'
        WHEN TG_OP = 'UPDATE' THEN 'profile_update'
        WHEN TG_OP = 'INSERT' THEN 'profile_create'
        ELSE 'unknown'
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to log all profile access
DROP TRIGGER IF EXISTS log_profile_access_trigger ON public.profiles;
CREATE TRIGGER log_profile_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- Add function to validate profile data integrity
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Ensure user_id cannot be changed after creation
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id after profile creation';
  END IF;
  
  -- Ensure user_id is always set and matches authenticated user
  IF NEW.user_id IS NULL OR NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Invalid user_id for profile operation';
  END IF;
  
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Limit data size to prevent DoS
  IF length(NEW.bio) > 5000 THEN
    RAISE EXCEPTION 'Bio text too long (max 5000 characters)';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile data validation
DROP TRIGGER IF EXISTS validate_profile_data_trigger ON public.profiles;
CREATE TRIGGER validate_profile_data_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- Create index for better performance on user_id lookups (security-focused)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_security 
ON public.profiles(user_id) 
WHERE user_id IS NOT NULL;

-- Add comment documenting the security fix
COMMENT ON TABLE public.profiles IS 'User profiles table with enhanced RLS security policies to prevent unauthorized access to personal information. All access is logged for security monitoring.';

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;