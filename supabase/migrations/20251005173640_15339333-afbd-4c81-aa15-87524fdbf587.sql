-- Add IP address and location tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login_ip inet,
ADD COLUMN IF NOT EXISTS last_login_location jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

-- Create login history table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet NOT NULL,
  location jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  login_method text DEFAULT 'password',
  success boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on login_history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own login history
CREATE POLICY "Users can view their own login history"
  ON public.login_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- System admins can view all login history
CREATE POLICY "System admins can view all login history"
  ON public.login_history
  FOR SELECT
  USING (current_user_has_role('system_admin'));

-- Only service role can insert login history (via edge function)
CREATE POLICY "Service role can insert login history"
  ON public.login_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON public.login_history(login_at DESC);

-- Add trigger to update profiles on login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_ip = NEW.ip_address,
    last_login_location = NEW.location,
    last_login_at = NEW.login_at
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_last_login
  AFTER INSERT ON public.login_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_login();