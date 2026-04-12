-- ============================================================
-- Fix admin role + subscription management RLS issues
-- Also prepares Stripe webhook path for automatic tier changes
-- ============================================================

-- 1. Add missing SELECT + DELETE policies on user_roles
--    (previously only INSERT and UPDATE were covered)

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System admins can view all roles" ON public.user_roles;
CREATE POLICY "System admins can view all roles"
ON public.user_roles
FOR SELECT
USING (current_user_has_role('system_admin'::app_role));

DROP POLICY IF EXISTS "System admins can delete roles" ON public.user_roles;
CREATE POLICY "System admins can delete roles"
ON public.user_roles
FOR DELETE
USING (current_user_has_role('system_admin'::app_role));

-- 2. Add INSERT WITH CHECK for subscription (Stripe webhook needs this via service role,
--    but also ensure the admin policy covers INSERT explicitly)

DROP POLICY IF EXISTS "System admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "System admins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
USING (current_user_has_role('system_admin'::app_role))
WITH CHECK (current_user_has_role('system_admin'::app_role));

-- 3. SECURITY DEFINER function: admin_update_user_access
--    Handles role + subscription update atomically, bypassing RLS.
--    Called from the admin UI. Also serves as the pattern for the
--    Stripe webhook edge function (which uses service_role key and
--    bypasses RLS entirely — so it calls upsert directly).
--
--    Returns: jsonb with {success: bool, error: text}

CREATE OR REPLACE FUNCTION public.admin_update_user_access(
  p_target_user_id  UUID,
  p_role            app_role,
  p_tier            TEXT,
  p_status          TEXT,
  p_expires_at      TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_now       TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Only system admins may call this function
  IF NOT current_user_has_role('system_admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorised: system_admin role required');
  END IF;

  -- Validate tier value
  IF p_tier NOT IN ('free', 'pro', 'enterprise') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid tier: must be free, pro, or enterprise');
  END IF;

  -- Validate status value
  IF p_status NOT IN ('active', 'suspended', 'expired', 'trial') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
  END IF;

  -- ── Role update ──────────────────────────────────────────────
  -- Insert the desired role (ignore if already exists for this user+role combo)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_target_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove any other roles for this user
  DELETE FROM public.user_roles
  WHERE user_id = p_target_user_id
    AND role <> p_role;

  -- ── Subscription update ──────────────────────────────────────
  INSERT INTO public.user_subscriptions (
    user_id, tier, status, started_at, expires_at, notes, updated_at
  )
  VALUES (
    p_target_user_id, p_tier, p_status, v_now, p_expires_at, p_notes, v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier       = EXCLUDED.tier,
    status     = EXCLUDED.status,
    expires_at = EXCLUDED.expires_at,
    notes      = EXCLUDED.notes,
    updated_at = v_now;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Allow authenticated users to call it (RLS check is inside the function)
GRANT EXECUTE ON FUNCTION public.admin_update_user_access(UUID, app_role, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT)
TO authenticated;


-- 4. SECURITY DEFINER function: stripe_update_subscription
--    Called by the Stripe webhook edge function (with service_role key).
--    Automatically upgrades/downgrades tier when Stripe payment is confirmed.
--    Edge function usage:
--      await supabase.rpc('stripe_update_subscription', {
--        p_stripe_customer_id: session.customer,
--        p_stripe_subscription_id: subscription.id,
--        p_tier: 'pro',          -- or 'free' on cancellation
--        p_status: 'active',     -- or 'expired' on cancellation
--        p_expires_at: null,     -- or period_end timestamp
--      })

CREATE OR REPLACE FUNCTION public.stripe_update_subscription(
  p_stripe_customer_id      TEXT,
  p_stripe_subscription_id  TEXT,
  p_user_email              TEXT DEFAULT NULL,
  p_tier                    TEXT DEFAULT 'pro',
  p_status                  TEXT DEFAULT 'active',
  p_expires_at              TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_now     TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Resolve user_id from stripe_customer_id or email fallback
  SELECT user_id INTO v_user_id
  FROM public.user_subscriptions
  WHERE stripe_customer_id = p_stripe_customer_id
  LIMIT 1;

  -- If not found by customer_id, try matching via auth.users email
  IF v_user_id IS NULL AND p_user_email IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_user_email
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found for stripe_customer_id: ' || p_stripe_customer_id);
  END IF;

  -- Upsert subscription — this triggers the realtime listener on the frontend
  INSERT INTO public.user_subscriptions (
    user_id, tier, status, started_at, expires_at,
    stripe_customer_id, stripe_subscription_id, updated_at
  )
  VALUES (
    v_user_id, p_tier, p_status, v_now, p_expires_at,
    p_stripe_customer_id, p_stripe_subscription_id, v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier                    = EXCLUDED.tier,
    status                  = EXCLUDED.status,
    expires_at              = EXCLUDED.expires_at,
    stripe_customer_id      = EXCLUDED.stripe_customer_id,
    stripe_subscription_id  = EXCLUDED.stripe_subscription_id,
    updated_at              = v_now;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Service role calls this from the webhook edge function
GRANT EXECUTE ON FUNCTION public.stripe_update_subscription(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE)
TO service_role;
GRANT EXECUTE ON FUNCTION public.stripe_update_subscription(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE)
TO authenticated;
