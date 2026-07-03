-- Fix Supabase advisor "Security Definer View" findings.
-- Without security_invoker, views run with the owner's privileges and bypass
-- RLS on the underlying tables. Switching to security_invoker makes the views
-- enforce the querying user's RLS policies on user_roles, user_agreements,
-- and profiles.
ALTER VIEW public.user_roles_with_email SET (security_invoker = true);
ALTER VIEW public.user_agreements_with_email SET (security_invoker = true);

-- user_roles and profiles already have "system admins can view all" SELECT
-- policies, but user_agreements only allowed users to see their own rows.
-- Without this, the admin page's agreements view would return only the
-- admin's own agreements once security_invoker is enforced.
DROP POLICY IF EXISTS "System admins can view all agreements" ON public.user_agreements;
CREATE POLICY "System admins can view all agreements"
ON public.user_agreements
FOR SELECT
USING (current_user_has_role('system_admin'::app_role));
