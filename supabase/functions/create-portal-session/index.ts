/**
 * Create Stripe Customer Portal Session
 * ──────────────────────────────────────
 * STATUS: SCAFFOLDED — not yet active.
 *
 * Redirects a Pro user to Stripe's self-service portal where they can:
 *   - View invoices
 *   - Update payment method
 *   - Cancel or change their subscription
 *
 * TO ACTIVATE: same STRIPE_ENABLED=true + STRIPE_SECRET_KEY as other functions.
 * Also configure the portal in Stripe Dashboard → Billing → Customer Portal.
 *
 * Frontend usage:
 *   const { data } = await supabase.functions.invoke('create-portal-session');
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: subRow } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subRow?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe customer found for this user.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/settings`,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-portal-session error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
