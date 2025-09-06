-- Fix infinite recursion in RLS policies and database function security issues

-- First, create security definer functions to avoid recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_project_role(project_id uuid, user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tm.role 
  FROM test_team_members tm 
  WHERE tm.project_id = $1 AND tm.user_id = $2;
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner_or_admin(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM test_projects p WHERE p.id = $1 AND p.user_id = $2
  ) OR EXISTS (
    SELECT 1 FROM test_team_members tm 
    WHERE tm.project_id = $1 AND tm.user_id = $2 AND tm.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM test_projects p WHERE p.id = $1 AND p.user_id = $2
  ) OR EXISTS (
    SELECT 1 FROM test_team_members tm WHERE tm.project_id = $1 AND tm.user_id = $2
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Project owners and admins can manage team members" ON test_team_members;
DROP POLICY IF EXISTS "Project owners and admins can update team members" ON test_team_members;
DROP POLICY IF EXISTS "Project owners and admins can delete team members" ON test_team_members;
DROP POLICY IF EXISTS "Users can view team members in their projects" ON test_team_members;

DROP POLICY IF EXISTS "Project owners and admins can update projects" ON test_projects;
DROP POLICY IF EXISTS "Users can view projects they are members of" ON test_projects;

-- Create new non-recursive policies for test_team_members
CREATE POLICY "Project owners and admins can manage team members"
ON test_team_members FOR INSERT
WITH CHECK (public.is_project_owner_or_admin(project_id, auth.uid()));

CREATE POLICY "Project owners and admins can update team members"
ON test_team_members FOR UPDATE
USING (public.is_project_owner_or_admin(project_id, auth.uid()));

CREATE POLICY "Project owners and admins can delete team members"
ON test_team_members FOR DELETE
USING (public.is_project_owner_or_admin(project_id, auth.uid()));

CREATE POLICY "Users can view team members in their projects"
ON test_team_members FOR SELECT
USING (public.is_project_member(project_id, auth.uid()));

-- Create new non-recursive policies for test_projects
CREATE POLICY "Project owners and admins can update projects"
ON test_projects FOR UPDATE
USING (public.is_project_owner_or_admin(id, auth.uid()));

CREATE POLICY "Users can view projects they are members of"
ON test_projects FOR SELECT
USING (public.is_project_member(id, auth.uid()));

-- Fix function security issues by adding proper search_path to existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_funding_source_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Update the remaining amount for the affected funding source
  UPDATE public.funding_sources 
  SET remaining_amount = total_amount - (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.funding_expenditures 
    WHERE funding_source_id = COALESCE(NEW.funding_source_id, OLD.funding_source_id)
  ),
  status = CASE 
    WHEN (total_amount - (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.funding_expenditures 
      WHERE funding_source_id = COALESCE(NEW.funding_source_id, OLD.funding_source_id)
    )) <= 0 THEN 'depleted'
    WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 'expired'
    ELSE 'active'
  END
  WHERE id = COALESCE(NEW.funding_source_id, OLD.funding_source_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add automatic user role assignment for new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Assign default role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'primary_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic role assignment
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Ensure all users have proper access to their profiles
CREATE OR REPLACE FUNCTION public.ensure_profile_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Ensure user_id cannot be changed after creation
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id after profile creation';
  END IF;
  
  -- Ensure user_id matches authenticated user for new records
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Invalid user_id for profile operation';
  END IF;
  
  -- Enhanced PII validation
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Limit text field sizes to prevent DoS
  IF length(COALESCE(NEW.bio, '')) > 5000 THEN
    RAISE EXCEPTION 'Bio text too long (max 5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.display_name, '')) > 255 THEN
    RAISE EXCEPTION 'Display name too long (max 255 characters)';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update profile trigger
DROP TRIGGER IF EXISTS ensure_profile_security_trigger ON profiles;
CREATE TRIGGER ensure_profile_security_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_security();