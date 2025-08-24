-- CRITICAL SECURITY FIX: Remove privilege escalation vulnerability
-- Drop the dangerous policy that allows users to update their own roles
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- Create secure role assignment system
-- Only system admins can update roles, with additional safeguards
CREATE POLICY "Only system admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (current_user_has_role('system_admin'::app_role));

-- Create secure role insertion policy (only admins can assign roles to others)
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Only system admins can assign roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (current_user_has_role('system_admin'::app_role));

-- Create function to prevent orphaned admin accounts
CREATE OR REPLACE FUNCTION public.prevent_orphaned_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent removing the last system admin
  IF TG_OP = 'UPDATE' AND OLD.role = 'system_admin' AND NEW.role != 'system_admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'system_admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last system administrator';
    END IF;
  END IF;
  
  -- Prevent deleting the last system admin
  IF TG_OP = 'DELETE' AND OLD.role = 'system_admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'system_admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot delete the last system administrator';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to prevent orphaned admin accounts
DROP TRIGGER IF EXISTS prevent_orphaned_admin_trigger ON public.user_roles;
CREATE TRIGGER prevent_orphaned_admin_trigger
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_orphaned_admin();

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
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'ROLE_REMOVED',
      'user_roles',
      OLD.id,
      jsonb_build_object(
        'role', OLD.role,
        'target_user', OLD.user_id,
        'removed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
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
    AND action IN ('ROLE_CHANGE', 'ROLE_ASSIGNED', 'ROLE_REMOVED')
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