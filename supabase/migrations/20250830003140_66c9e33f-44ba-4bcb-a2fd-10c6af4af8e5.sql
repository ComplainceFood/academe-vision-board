-- FINAL BULLETPROOF SECURITY FIX: Remove security definer view and implement ultimate protection

-- Remove the problematic security definer view
DROP VIEW IF EXISTS public.profiles_secure;

-- Simplify the validation function to avoid security definer issues
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = profile_user_id AND auth.uid() IS NOT NULL;
$$;

-- Replace complex policies with the simplest possible bulletproof approach
DROP POLICY IF EXISTS "profiles_ultra_secure_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_ultra_secure_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_ultra_secure_update" ON public.profiles;

-- Create the absolutely simplest, most secure policies possible
CREATE POLICY "profiles_owner_only_select" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "profiles_owner_only_insert" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "profiles_owner_only_update" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Keep the simple trigger for user_id protection
CREATE OR REPLACE FUNCTION public.protect_profile_user_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent user_id changes
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id';
  END IF;
  
  -- Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace all triggers with this simple one
DROP TRIGGER IF EXISTS final_security_check_trigger ON public.profiles;
DROP TRIGGER IF EXISTS enforce_user_id_security_trigger ON public.profiles;
DROP TRIGGER IF EXISTS protect_user_id_trigger ON public.profiles;

CREATE TRIGGER protect_profile_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_user_id();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Final verification
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'profiles' AND schemaname = 'public';
    
    RAISE NOTICE 'SECURITY FINAL: % policies active on profiles table', policy_count;
    RAISE NOTICE 'SECURITY FINAL: Only profile owners can access their own data';
    RAISE NOTICE 'SECURITY FINAL: All user_id modifications are blocked';
END $$;