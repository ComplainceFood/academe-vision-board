-- Add pro_free_promo flag and allow anon reads so the public landing page
-- can reflect the promo state without requiring authentication.

INSERT INTO public.feature_flags (key, enabled)
VALUES ('pro_free_promo', false)
ON CONFLICT (key) DO NOTHING;

-- Allow anonymous (unauthenticated) visitors to read the promo flag.
-- Scoped to only this key so general feature flags remain auth-gated.
CREATE POLICY "Anon can read pro_free_promo flag"
ON public.feature_flags
FOR SELECT
TO anon
USING (key = 'pro_free_promo');
