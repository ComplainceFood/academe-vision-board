-- FINAL BULLETPROOF FIX: Remove ALL conflicting policies and create only simple ones
-- This will eliminate any possibility of bypassing security through policy conflicts

-- Remove ALL policies completely (including the old complex ones that weren't properly removed)
DROP POLICY IF EXISTS "profiles_bulletproof_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_bulletproof_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_bulletproof_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_secure_select_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_secure_insert_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_secure_update_own_only" ON public.profiles;

-- Check if RLS is enabled and enable it if not
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ONLY these three simple, bulletproof policies
-- No complex functions, no additional checks that could have gaps

CREATE POLICY "profiles_select_own_only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own_only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own_only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Explicitly deny DELETE operations by not creating a DELETE policy
-- This means NO ONE can delete profiles, not even the owner

-- Add final validation to prevent any user_id manipulation
CREATE OR REPLACE FUNCTION public.enforce_user_id_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Block changing user_id after creation
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id';
  END IF;
  
  -- Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the final security trigger
DROP TRIGGER IF EXISTS enforce_user_id_security_trigger ON public.profiles;
CREATE TRIGGER enforce_user_id_security_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_id_security();

-- Final check: List all policies to ensure we only have the 3 simple ones
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'profiles' AND schemaname = 'public';
    
    IF policy_count != 3 THEN
        RAISE EXCEPTION 'SECURITY ERROR: Expected exactly 3 policies, found %', policy_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Exactly 3 bulletproof policies are active on profiles table';
END $$;