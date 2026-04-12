/**
 * Create Stripe Checkout Session
 * ────────────────────────────────
 * STATUS: SCAFFOLDED - not yet active.
 *
 * Called from the frontend when a user clicks "Upgrade to Pro".
 * Returns a Stripe Checkout URL to redirect the user to.
 *
 * TO ACTIVATE:
 *   1. Set STRIPE_ENABLED=true (same secret as stripe-webhook)
 *   2. Set STRIPE_PRO_PRICE_ID to your Stripe Price ID:
 *      supabase secrets set STRIPE_PRO_PRICE_ID=price_XXXXXXXXXXXXXXXX
 *   3. Deploy: supabase functions deploy create-checkout-session
 *
 * Frontend usage (when ready):
 *   const { data } = await supabase.functions.invoke('create-checkout-session', {
 *     body: { priceId: 'pro_monthly', successUrl: window.location.origin + '/settings?upgraded=1' }
 *   });
 *   window.location.href = data.url;
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_ENABLED = Deno.env.get('STRIPE_ENABLED') === 'true';
  if (!STRIPE_ENABLED) {
    return new Response(
      JSON.stringify({ error: 'Stripe integration is not yet enabled.' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() });

    // Authenticate the calling user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: corsHeaders });
    }

    const { successUrl } = await req.json();

    // Price IDs - monthly and annual Pro plans
    const PRO_MONTHLY = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? '';
    const PRO_ANNUAL  = Deno.env.get('STRIPE_PRO_ANNUAL_PRICE_ID') ?? PRO_MONTHLY;

    // Look up or create a Stripe customer for this user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: subRow } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = subRow?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Persist customer ID immediately so the webhook can find the user
      await supabaseAdmin
        .from('user_subscriptions')
        .upsert({ user_id: user.id, stripe_customer_id: customerId, tier: 'free', status: 'active' }, { onConflict: 'user_id' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRO_MONTHLY, quantity: 1 }],
      success_url: successUrl ?? `${req.headers.get('origin')}/settings?upgraded=1`,
      cancel_url: `${req.headers.get('origin')}/settings?cancelled=1`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
        trial_period_days: 14,  // 14-day free trial for new Pro subscribers - remove when ready
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
