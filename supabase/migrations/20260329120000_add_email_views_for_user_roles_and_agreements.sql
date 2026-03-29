-- View: user_roles_with_email
-- Joins user_roles with profiles so admins can see email alongside role
CREATE OR REPLACE VIEW public.user_roles_with_email AS
SELECT
  ur.id,
  ur.user_id,
  ur.role,
  ur.created_at,
  ur.updated_at,
  p.email,
  p.display_name,
  p.first_name,
  p.last_name
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id;

-- View: user_agreements_with_email
-- Joins user_agreements with profiles so admins can see email alongside agreement records
CREATE OR REPLACE VIEW public.user_agreements_with_email AS
SELECT
  ua.id,
  ua.user_id,
  ua.agreement_type,
  ua.version,
  ua.agreed_at,
  ua.ip_address,
  ua.user_agent,
  ua.created_at,
  p.email,
  p.display_name,
  p.first_name,
  p.last_name
FROM public.user_agreements ua
LEFT JOIN public.profiles p ON p.user_id = ua.user_id;

-- Grant SELECT on the views to authenticated users
-- (RLS on underlying tables still protects row-level access)
GRANT SELECT ON public.user_roles_with_email TO authenticated;
GRANT SELECT ON public.user_agreements_with_email TO authenticated;
