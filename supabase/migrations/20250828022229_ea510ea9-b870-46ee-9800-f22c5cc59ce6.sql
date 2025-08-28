-- Fix remaining function search path and extension security issues

-- Move extensions from public schema to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move any existing extensions to the extensions schema
-- Note: This would typically be done by dropping and recreating extensions
-- but since extensions may be critical, we'll just create the schema for future use

-- Check for any remaining functions without proper search_path
-- Fix any audit and role-related functions that might be missing search_path

CREATE OR REPLACE FUNCTION public.prevent_orphaned_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.check_role_change_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.log_bulk_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.log_calendar_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- This would be called from the edge function to log sync results
  RETURN NEW;
END;
$$;