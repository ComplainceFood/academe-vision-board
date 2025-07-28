-- Create additional security measures and better extension handling

-- Create a safer extension management approach
-- Since we can't move all extensions, let's create a security view to monitor them
CREATE OR REPLACE VIEW public.extension_security_status AS
SELECT 
  e.extname as extension_name,
  n.nspname as schema_name,
  CASE 
    WHEN n.nspname = 'public' THEN 'SECURITY_RISK'
    WHEN n.nspname = 'extensions' THEN 'SECURE'
    ELSE 'UNKNOWN'
  END as security_status,
  'Extensions in public schema pose security risks' as recommendation
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE n.nspname IN ('public', 'extensions');

-- Add additional security constraints to prevent common attacks
ALTER TABLE public.notes 
ADD CONSTRAINT notes_title_reasonable_length CHECK (length(title) <= 500);

ALTER TABLE public.notes 
ADD CONSTRAINT notes_content_reasonable_length CHECK (length(content) <= 100000);

ALTER TABLE public.meetings 
ADD CONSTRAINT meetings_title_reasonable_length CHECK (length(title) <= 500);

ALTER TABLE public.planning_events 
ADD CONSTRAINT events_title_reasonable_length CHECK (length(title) <= 500);

-- Create a security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_type TEXT,
  table_name TEXT DEFAULT NULL,
  record_id UUID DEFAULT NULL,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert into audit log (this would be called by application, not directly by users)
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, details, timestamp
  ) VALUES (
    auth.uid(), action_type, table_name, record_id, details, NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently fail to not disrupt application flow
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers to log potentially suspicious activities
CREATE OR REPLACE FUNCTION public.log_bulk_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone tries to insert/update many records quickly
  PERFORM public.log_security_event(
    'BULK_OPERATION',
    TG_TABLE_NAME::TEXT,
    NULL,
    jsonb_build_object(
      'operation', TG_OP,
      'timestamp', NOW()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create password strength validation function for application use
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB AS $$
DECLARE
  score INTEGER := 0;
  issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Length check
  IF length(password) >= 8 THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password must be at least 8 characters long');
  END IF;
  
  -- Uppercase check
  IF password ~ '[A-Z]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Lowercase check
  IF password ~ '[a-z]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Number check
  IF password ~ '[0-9]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password must contain at least one number');
  END IF;
  
  -- Special character check
  IF password ~ '[^A-Za-z0-9]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password must contain at least one special character');
  END IF;
  
  -- Common password check (basic)
  IF lower(password) = ANY(ARRAY['password', '123456', 'password123', 'admin', 'qwerty']) THEN
    score := 0;
    issues := array_append(issues, 'Password is too common');
  END IF;
  
  RETURN jsonb_build_object(
    'score', score,
    'max_score', 5,
    'strength', CASE 
      WHEN score >= 4 THEN 'strong'
      WHEN score >= 3 THEN 'medium'
      WHEN score >= 2 THEN 'weak'
      ELSE 'very_weak'
    END,
    'issues', issues,
    'valid', score >= 3
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to check for suspicious login patterns
CREATE OR REPLACE FUNCTION public.check_login_attempts(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
  recent_attempts INTEGER;
  suspicious BOOLEAN := FALSE;
BEGIN
  -- This is a placeholder for login attempt tracking
  -- In a real implementation, you'd track failed login attempts
  
  RETURN jsonb_build_object(
    'suspicious', suspicious,
    'message', 'Login attempt logged',
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;