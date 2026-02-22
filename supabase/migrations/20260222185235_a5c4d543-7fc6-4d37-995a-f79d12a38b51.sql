
-- Fix all profile validation functions to allow empty string emails

CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id after profile creation';
  END IF;
  
  IF NEW.user_id IS NULL OR NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Invalid user_id for profile operation';
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF length(NEW.bio) > 5000 THEN
    RAISE EXCEPTION 'Bio text too long (max 5000 characters)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.ensure_profile_security()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id after profile creation';
  END IF;
  
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Invalid user_id for profile operation';
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF length(COALESCE(NEW.bio, '')) > 5000 THEN
    RAISE EXCEPTION 'Bio text too long (max 5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.display_name, '')) > 255 THEN
    RAISE EXCEPTION 'Display name too long (max 255 characters)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_profile_pii()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot change user_id after profile creation';
  END IF;
  
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Profile user_id must match authenticated user';
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format detected';
  END IF;
  
  IF length(COALESCE(NEW.bio, '')) > 5000 THEN
    RAISE EXCEPTION 'Bio text exceeds maximum length (5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.display_name, '')) > 255 THEN
    RAISE EXCEPTION 'Display name exceeds maximum length (255 characters)';
  END IF;
  
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone !~ '^[\+]?[0-9\-\(\)\s\.]+$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_profile_pii_security()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot change user_id';
  END IF;
  
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Profile access denied';
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF length(COALESCE(NEW.bio, '')) > 5000 THEN
    RAISE EXCEPTION 'Bio text too long (max 5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.display_name, '')) > 255 THEN
    RAISE EXCEPTION 'Display name too long (max 255 characters)';
  END IF;
  
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone !~ '^[\+]?[0-9\-\(\)\s\.]+$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
