-- CRITICAL SECURITY FIX: Secure profiles table against unauthorized access
-- This addresses "User Personal Information Could Be Stolen by Hackers"

-- Drop existing policies to recreate them securely
DROP POLICY IF EXISTS "authenticated_users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_select_own_profile_enhanced" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own_profile" ON public.profiles;

-- Create ultra-strict RLS policies
-- 1. SELECT: Users can ONLY access their own profile
CREATE POLICY "profiles_secure_select" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(30)
  AND prevent_anonymous_access()
);

-- 2. INSERT: Users can ONLY create their own profile
CREATE POLICY "profiles_secure_insert" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND is_authenticated_recently(15)
  AND prevent_anonymous_access()
);

-- 3. UPDATE: Users can ONLY update their own profile
CREATE POLICY "profiles_secure_update" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_authenticated_recently(15)
  AND prevent_anonymous_access()
)
WITH CHECK (
  auth.uid() = user_id
);

-- 4. NO DELETE POLICY: Prevent direct profile deletion

-- Add security logging function
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log all profile operations for security audit
  PERFORM public.log_security_event(
    'PROFILE_ACCESS',
    'profiles',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'user_id', auth.uid(),
      'timestamp', NOW()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply security logging trigger
DROP TRIGGER IF EXISTS profile_security_log ON public.profiles;
CREATE TRIGGER profile_security_log
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add performance index for security lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_security 
ON public.profiles(user_id) 
WHERE user_id IS NOT NULL;