/**
 * Stripe Webhook Handler
 * ──────────────────────
 * STATUS: SCAFFOLDED — not yet active.
 *
 * TO ACTIVATE:
 *   1. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to Supabase secrets:
 *      supabase secrets set STRIPE_SECRET_KEY=sk_live_...
 *      supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
 *
 *   2. Deploy this function:
 *      supabase functions deploy stripe-webhook --no-verify-jwt
 *
 *   3. In Stripe Dashboard → Webhooks → Add endpoint:
 *      URL: https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
 *      Events to listen for:
 *        - checkout.session.completed
 *        - customer.subscription.updated
 *        - customer.subscription.deleted
 *        - invoice.payment_failed
 *
 *   4. Copy the webhook signing secret (whsec_...) into STRIPE_WEBHOOK_SECRET above.
 *
 *   5. Set STRIPE_ENABLED=true in Supabase secrets to activate:
 *      supabase secrets set STRIPE_ENABLED=true
 *
 * TIER MAPPING (Stripe Price IDs → SmartProf tiers):
 *   Update PRICE_TO_TIER below with your actual Stripe Price IDs.
 *   Free plan: no Stripe product needed — default on signup.
 *   Pro plan:  create a Product "SmartProf Pro" with a monthly + annual price.
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// ── Configuration ─────────────────────────────────────────────────────────────

// Set STRIPE_ENABLED=true in Supabase secrets when ready to go live
const STRIPE_ENABLED = Deno.env.get('STRIPE_ENABLED') === 'true';

// Map your Stripe Price IDs to SmartProf tiers.
// Replace these placeholder IDs with your real ones from Stripe Dashboard.
const PRICE_TO_TIER: Record<string, 'free' | 'pro'> = {
  // 'price_XXXXXXXXXXXXXXXX': 'pro',   // Pro Monthly
  // 'price_YYYYYYYYYYYYYYYY': 'pro',   // Pro Annual
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Guard: return 200 immediately if Stripe integration is not yet enabled.
  // This prevents errors while the function is deployed but inactive.
  if (!STRIPE_ENABLED) {
    console.log('Stripe integration is disabled. Set STRIPE_ENABLED=true to activate.');
    return new Response(JSON.stringify({ received: true, active: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return new Response('Stripe not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() });
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verify Stripe signature
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  console.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {

      // ── User pays and completes checkout ───────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email ?? null;

        // Fetch the subscription to get the price ID
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] ?? 'pro';
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        const { data: result } = await supabase.rpc('stripe_update_subscription', {
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscriptionId,
          p_user_email: customerEmail,
          p_tier: tier,
          p_status: 'active',
          p_expires_at: periodEnd,
        });

        if (!result?.success) {
          console.error('stripe_update_subscription failed:', result?.error);
        } else {
          console.log(`User upgraded to ${tier}: customer ${customerId}`);
        }
        break;
      }

      // ── Subscription renewed or changed ────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] ?? 'pro';
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'trialing' ? 'trial'
          : subscription.status === 'past_due' ? 'suspended'
          : 'expired';

        await supabase.rpc('stripe_update_subscription', {
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscription.id,
          p_user_email: null,
          p_tier: status === 'active' || status === 'trial' ? tier : 'free',
          p_status: status,
          p_expires_at: periodEnd,
        });

        console.log(`Subscription updated: ${customerId} → ${tier} / ${status}`);
        break;
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase.rpc('stripe_update_subscription', {
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscription.id,
          p_user_email: null,
          p_tier: 'free',
          p_status: 'expired',
          p_expires_at: null,
        });

        console.log(`Subscription cancelled: ${customerId} → downgraded to free`);
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Suspend access after failed payment — Stripe will retry automatically
        await supabase
          .from('user_subscriptions')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId);

        console.log(`Payment failed: ${customerId} → suspended`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Error processing webhook event:', err);
    return new Response('Internal error processing event', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
