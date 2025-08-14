-- Ensure robust RLS on profiles and prevent ownership changes via UPDATE
BEGIN;

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate UPDATE policy to include WITH CHECK so users cannot switch ownership
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT;