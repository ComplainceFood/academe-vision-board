-- ============================================================
-- Support 'promo' subscription status and secure promo grant RPC
-- ============================================================

-- RPC: grant_promo_pro
-- Called from the grant-promo-pro edge function (service role).
-- Validates the user is new (created within 60s) and the promo flag
-- is active before writing the pro tier. Prevents abuse.
CREATE OR REPLACE FUNCTION public.grant_promo_pro(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_active BOOLEAN;
  v_created_at   TIMESTAMPTZ;
BEGIN
  -- Check promo flag is still on
  SELECT enabled INTO v_promo_active
  FROM public.feature_flags
  WHERE key = 'pro_free_promo';

  IF NOT COALESCE(v_promo_active, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Promo is not active');
  END IF;

  -- Check user was created within the last 5 minutes (new signup guard)
  SELECT created_at INTO v_created_at
  FROM auth.users
  WHERE id = p_user_id;

  IF v_created_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF now() - v_created_at > INTERVAL '5 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Promo only available for new signups');
  END IF;

  -- Grant pro with status='promo' and no expiry (expiry set when promo closes)
  INSERT INTO public.user_subscriptions (user_id, tier, status, started_at)
  VALUES (p_user_id, 'pro', 'promo', now())
  ON CONFLICT (user_id) DO UPDATE SET
    tier       = 'pro',
    status     = 'promo',
    started_at = now(),
    expires_at = NULL;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_promo_pro(UUID) TO service_role;

-- RPC: expire_promo_users
-- Called by the admin when turning promo OFF.
-- Sets expires_at = now() + grace_days for all promo-status accounts
-- that have no Stripe subscription (i.e. genuinely free promo users).
CREATE OR REPLACE FUNCTION public.expire_promo_users(grace_days INT DEFAULT 15)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF NOT current_user_has_role('system_admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorised');
  END IF;

  UPDATE public.user_subscriptions
  SET
    expires_at = now() + (grace_days || ' days')::INTERVAL,
    status     = 'promo'
  WHERE
    status = 'promo'
    AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '')
    AND (expires_at IS NULL OR expires_at > now());

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'affected', v_count);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_promo_users(INT) TO authenticated;
