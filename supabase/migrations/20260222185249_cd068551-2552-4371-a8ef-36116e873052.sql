
-- The update_last_login trigger fires on login_history insert (done via service role),
-- which updates profiles. But profile validation triggers check auth.uid() which is NULL
-- for service role. Fix by making update_last_login use SECURITY DEFINER and bypass validation.

-- Drop and recreate update_last_login as SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_ip = NEW.ip_address,
    last_login_location = NEW.location,
    last_login_at = NEW.login_at
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
