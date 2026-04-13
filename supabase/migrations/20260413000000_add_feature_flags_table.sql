-- ============================================================
-- Add feature_flags table for server-side feature flag storage
-- Previously feature flags were stored in localStorage (admin-only browser),
-- meaning admin toggles never propagated to other users' sessions.
-- This table replaces localStorage as the source of truth.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed all known feature flag keys as disabled by default
INSERT INTO public.feature_flags (key, enabled) VALUES
  ('achievements_cv_import',    false),
  ('achievements_resume_export', false),
  ('achievements_biosketch',    false),
  ('achievements_orcid',        false),
  ('achievements_citation_metrics', false),
  ('analytics_ai_insights',     false),
  ('planning_outlook_sync',     false),
  ('planning_google_sync',      false),
  ('planning_ai_event',         false),
  ('funding_ai_narrative',      false),
  ('meetings_ai_agenda',        false),
  ('meetings_ai_summary',       false),
  ('notes_ai_draft',            false),
  ('supplies_ai_analysis',      false),
  ('data_export_import',        false)
ON CONFLICT (key) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read feature flags (needed for canUse() checks)
CREATE POLICY "Authenticated users can read feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

-- Only system admins can write feature flags
CREATE POLICY "System admins can manage feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (current_user_has_role('system_admin'::app_role))
WITH CHECK (current_user_has_role('system_admin'::app_role));

-- ── Enable realtime ───────────────────────────────────────────────────────────
-- This allows useFeatureFlags to subscribe to changes and update all sessions
-- immediately when an admin toggles a flag.
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;

-- ── Helper RPC: admin_set_feature_flag ───────────────────────────────────────
-- SECURITY DEFINER so it bypasses RLS for upsert, but validates caller role.
CREATE OR REPLACE FUNCTION public.admin_set_feature_flag(
  p_key     TEXT,
  p_enabled BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT current_user_has_role('system_admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorised: system_admin role required');
  END IF;

  INSERT INTO public.feature_flags (key, enabled, updated_at, updated_by)
  VALUES (p_key, p_enabled, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE SET
    enabled    = EXCLUDED.enabled,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_feature_flag(TEXT, BOOLEAN) TO authenticated;
