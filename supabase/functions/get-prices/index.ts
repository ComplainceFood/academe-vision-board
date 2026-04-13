/**
 * Get Stripe Prices
 * ──────────────────
 * Returns live pricing from Stripe so the frontend never has hardcoded prices.
 * Does NOT require STRIPE_ENABLED — price data is not sensitive.
 *
 * Response shape:
 * {
 *   monthly: { id: string; unit_amount: number | null; currency: string; interval: string }
 *   annual:  { id: string; unit_amount: number | null; currency: string; interval: string }
 * }
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function ok(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const monthlyId = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? '';
  const annualId  = Deno.env.get('STRIPE_PRO_ANNUAL_PRICE_ID') ?? '';

  // If no Stripe key, return empty shells — UI will show "—"
  if (!stripeKey || !monthlyId) {
    return ok({
      monthly: { id: monthlyId, unit_amount: null, currency: 'usd', interval: 'month' },
      annual:  { id: annualId,  unit_amount: null, currency: 'usd', interval: 'year'  },
    });
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const [monthly, annual] = await Promise.all([
      stripe.prices.retrieve(monthlyId),
      annualId ? stripe.prices.retrieve(annualId) : Promise.resolve(null),
    ]);

    return ok({
      monthly: {
        id: monthly.id,
        unit_amount: monthly.unit_amount,
        currency: monthly.currency,
        interval: monthly.recurring?.interval ?? 'month',
      },
      annual: annual
        ? {
            id: annual.id,
            unit_amount: annual.unit_amount,
            currency: annual.currency,
            interval: annual.recurring?.interval ?? 'year',
          }
        : { id: annualId, unit_amount: null, currency: 'usd', interval: 'year' },
    });
  } catch (err) {
    console.error('get-prices error:', err);
    // Return shells rather than 500 so the UI still renders
    return ok({
      monthly: { id: monthlyId, unit_amount: null, currency: 'usd', interval: 'month' },
      annual:  { id: annualId,  unit_amount: null, currency: 'usd', interval: 'year'  },
    });
  }
});
