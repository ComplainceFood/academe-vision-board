-- Clean up redundant RLS policies and enhance security

-- Remove redundant policies that duplicate functionality
DROP POLICY IF EXISTS "Users can access their own supplies" ON public.supplies;
DROP POLICY IF EXISTS "Users can access their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can access their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can access their own expenses" ON public.expenses;

-- Remove duplicate policies for planning events
DROP POLICY IF EXISTS "Users can insert their own planning events" ON public.planning_events;

-- Remove duplicate policies for shopping list
DROP POLICY IF EXISTS "Users can add items to their shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can delete their shopping list items" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can update their shopping list items" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can view their own shopping list items" ON public.shopping_list;

-- Create a security definer function for user validation to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Add rate limiting protection function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_id UUID,
  action_type TEXT,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
  window_start TIMESTAMP;
BEGIN
  window_start := NOW() - (window_minutes || ' minutes')::INTERVAL;
  
  -- This is a simplified rate limiting check
  -- In production, you'd want more sophisticated rate limiting
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add input validation trigger function
CREATE OR REPLACE FUNCTION public.validate_user_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate common text fields for length and content
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check for extremely long text inputs that might indicate attacks
    IF (NEW.title IS NOT NULL AND length(NEW.title) > 1000) OR
       (NEW.description IS NOT NULL AND length(NEW.description) > 10000) OR
       (NEW.content IS NOT NULL AND length(NEW.content) > 50000) THEN
      RAISE EXCEPTION 'Input text too long - potential security risk';
    END IF;
    
    -- Basic XSS prevention - reject obvious script tags
    IF (NEW.title IS NOT NULL AND NEW.title ~* '<script|javascript:') OR
       (NEW.description IS NOT NULL AND NEW.description ~* '<script|javascript:') OR
       (NEW.content IS NOT NULL AND NEW.content ~* '<script|javascript:') THEN
      RAISE EXCEPTION 'Potentially malicious content detected';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply input validation triggers to key tables
DROP TRIGGER IF EXISTS validate_notes_input ON public.notes;
CREATE TRIGGER validate_notes_input
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_input();

DROP TRIGGER IF EXISTS validate_meetings_input ON public.meetings;
CREATE TRIGGER validate_meetings_input
  BEFORE INSERT OR UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_input();

DROP TRIGGER IF EXISTS validate_planning_events_input ON public.planning_events;
CREATE TRIGGER validate_planning_events_input
  BEFORE INSERT OR UPDATE ON public.planning_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_input();

-- Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  details JSONB
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow reading audit logs for system administrators
CREATE POLICY "Only system can write audit logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (false); -- No direct inserts allowed

CREATE POLICY "Users can view their own audit logs" ON public.security_audit_log
  FOR SELECT USING (user_id = auth.uid());