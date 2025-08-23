-- CRITICAL SECURITY FIX: Remove privilege escalation vulnerability
-- Drop the dangerous policy that allows users to update their own roles
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- Create secure role assignment system
-- Only system admins can assign roles, and prevent orphaned admin accounts
CREATE POLICY "Only system admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  current_user_has_role('system_admin'::app_role) 
  AND (
    -- Prevent removing the last system admin
    OLD.role != 'system_admin' OR
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'system_admin') > 1
  )
);

-- Create secure role insertion policy (only admins can assign roles to others)
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Only system admins can assign roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  current_user_has_role('system_admin'::app_role) OR
  (auth.uid() = user_id AND role = 'primary_user') -- Allow self-assignment of primary_user only
);

-- Add audit logging for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes to security audit log
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    PERFORM public.log_security_event(
      'ROLE_CHANGE',
      'user_roles',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user', NEW.user_id,
        'changed_by', auth.uid()
      )
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'ROLE_ASSIGNED',
      'user_roles',
      NEW.id,
      jsonb_build_object(
        'role', NEW.role,
        'target_user', NEW.user_id,
        'assigned_by', auth.uid()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- Add rate limiting function for sensitive operations
CREATE OR REPLACE FUNCTION public.check_role_change_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_changes INTEGER;
BEGIN
  -- Check for suspicious role change activity
  SELECT COUNT(*) INTO recent_changes
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND action IN ('ROLE_CHANGE', 'ROLE_ASSIGNED')
    AND timestamp > NOW() - INTERVAL '1 hour';
    
  IF recent_changes > 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded for role operations';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limiting trigger
DROP TRIGGER IF EXISTS role_change_rate_limit_trigger ON public.user_roles;
CREATE TRIGGER role_change_rate_limit_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.check_role_change_rate_limit();

-- Create function to safely assign initial user role
CREATE OR REPLACE FUNCTION public.assign_initial_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign role if user doesn't have one yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'primary_user');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user creation trigger to use secure role assignment
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_initial_user_role();

-- Create function to detect suspicious security events
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TABLE(
  user_id UUID,
  suspicious_events BIGINT,
  event_types TEXT[],
  first_event TIMESTAMP WITH TIME ZONE,
  last_event TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sal.user_id,
    COUNT(*) as suspicious_events,
    array_agg(DISTINCT sal.action) as event_types,
    MIN(sal.timestamp) as first_event,
    MAX(sal.timestamp) as last_event
  FROM public.security_audit_log sal
  WHERE sal.timestamp > NOW() - INTERVAL '24 hours'
    AND sal.action IN ('ROLE_CHANGE', 'BULK_OPERATION', 'SUSPICIOUS_LOGIN')
  GROUP BY sal.user_id
  HAVING COUNT(*) > 3
  ORDER BY suspicious_events DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enhanced validation function for critical operations
CREATE OR REPLACE FUNCTION public.validate_critical_operation(operation_type TEXT, target_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role app_role;
  target_user_role app_role;
BEGIN
  -- Get current user role
  current_user_role := public.get_user_role(auth.uid());
  
  -- Validate based on operation type
  CASE operation_type
    WHEN 'role_assignment' THEN
      -- Only system admins can assign roles
      IF current_user_role != 'system_admin' THEN
        RETURN FALSE;
      END IF;
      
    WHEN 'bulk_operation' THEN
      -- Require at least primary_user role for bulk operations
      IF current_user_role NOT IN ('system_admin', 'primary_user') THEN
        RETURN FALSE;
      END IF;
      
    WHEN 'data_export' THEN
      -- Allow all authenticated users but log the action
      PERFORM public.log_security_event('DATA_EXPORT', NULL, NULL, 
        jsonb_build_object('user_role', current_user_role));
      
    ELSE
      -- Unknown operation type - deny by default
      RETURN FALSE;
  END CASE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;