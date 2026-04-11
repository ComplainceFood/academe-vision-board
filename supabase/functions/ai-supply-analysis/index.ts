import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Authentication failed');

    const [suppliesRes, expensesRes] = await Promise.all([
      supabase.from('supplies').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('id,description,amount,date,category').eq('user_id', user.id),
    ]);

    const supplies = suppliesRes.data || [];
    const expenses = expensesRes.data || [];

    if (supplies.length === 0) {
      return new Response(JSON.stringify({
        suggestions: [{
          item_name: 'No inventory data',
          action: 'add_items',
          reason: 'Add supply items to your inventory to receive AI-powered reorder suggestions.',
          urgency: 'low',
          suggested_quantity: 0,
          estimated_cost: 0,
        }]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const today = new Date();

    const lowStock = supplies.filter((s: any) => s.current_count <= s.threshold);
    const outOfStock = supplies.filter((s: any) => s.current_count === 0);
    const healthy = supplies.filter((s: any) => s.current_count > s.threshold);

    // Recent spending by category
    const last30 = expenses.filter((e: any) => {
      const d = new Date(e.date);
      return (today.getTime() - d.getTime()) < 30 * 24 * 3600 * 1000;
    });
    const spendByCategory = last30.reduce((acc: any, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
      return acc;
    }, {});

    const totalInventoryValue = supplies.reduce((s: number, i: any) =>
      s + (parseFloat(i.cost || 0) * parseInt(i.current_count || 0)), 0);

    const supplySummary = supplies.slice(0, 30).map((s: any) => ({
      name: s.name,
      category: s.category,
      current: s.current_count,
      threshold: s.threshold,
      total_capacity: s.total_count,
      unit_cost: s.cost,
      last_restocked: s.last_restocked,
    }));

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ suggestions: ruleBasedSuggestions(supplies, expenses) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are an AI assistant helping an academic professional manage their lab/office supplies.
Today: ${today.toISOString().split('T')[0]}

INVENTORY SNAPSHOT:
- Total items tracked: ${supplies.length}
- Out of stock: ${outOfStock.length}
- Below threshold: ${lowStock.length}
- Healthy stock: ${healthy.length}
- Total inventory value: $${totalInventoryValue.toFixed(2)}

ITEM DETAILS:
${JSON.stringify(supplySummary, null, 2)}

RECENT EXPENSES (last 30 days by category):
${Object.entries(spendByCategory).map(([cat, amt]) => `- ${cat}: $${(amt as number).toFixed(2)}`).join('\n') || '- No recent expenses'}

Analyse this inventory and produce 4–8 specific reorder recommendations.

Return ONLY valid JSON, no markdown:
{
  "suggestions": [
    {
      "item_name": "exact item name from the data",
      "action": "reorder_now|reorder_soon|monitor|reduce_threshold",
      "reason": "2 sentences explaining why, referencing actual numbers",
      "urgency": "high|medium|low",
      "suggested_quantity": 10,
      "estimated_cost": 25.50
    }
  ],
  "summary": "2-3 sentence overall inventory health summary with key numbers"
}

Rules:
- high urgency = out of stock or current_count is 0 or below 50% of threshold
- medium urgency = below threshold but not critical
- low urgency = approaching threshold or optimisation
- suggested_quantity = how many units to reorder (base on threshold and total_capacity)
- estimated_cost = suggested_quantity × unit_cost
- Focus on actionable items, not all items`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', response.status, err);
      return new Response(JSON.stringify({ suggestions: ruleBasedSuggestions(supplies, expenses) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ suggestions: ruleBasedSuggestions(supplies, expenses) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(jsonMatch[0], {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ai-supply-analysis error:', error);
    return new Response(
      JSON.stringify({ error: String(error), suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function ruleBasedSuggestions(supplies: any[], expenses: any[]): any[] {
  const suggestions: any[] = [];

  for (const s of supplies) {
    const pct = s.threshold > 0 ? s.current_count / s.threshold : 1;
    if (s.current_count === 0) {
      suggestions.push({
        item_name: s.name,
        action: 'reorder_now',
        reason: `${s.name} is completely out of stock (0 units). Immediate reorder required to avoid disruption.`,
        urgency: 'high',
        suggested_quantity: s.total_count || s.threshold * 2,
        estimated_cost: parseFloat(s.cost || 0) * (s.total_count || s.threshold * 2),
      });
    } else if (pct <= 1) {
      const qty = (s.total_count || s.threshold * 2) - s.current_count;
      suggestions.push({
        item_name: s.name,
        action: 'reorder_now',
        reason: `${s.name} has ${s.current_count} units remaining, at or below the threshold of ${s.threshold}. Reorder to restore to full capacity.`,
        urgency: pct < 0.5 ? 'high' : 'medium',
        suggested_quantity: Math.max(qty, s.threshold),
        estimated_cost: parseFloat(s.cost || 0) * Math.max(qty, s.threshold),
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      item_name: 'All supplies',
      action: 'monitor',
      reason: `All ${supplies.length} inventory items are above their restock thresholds. Continue monitoring regularly.`,
      urgency: 'low',
      suggested_quantity: 0,
      estimated_cost: 0,
    });
  }

  return suggestions.slice(0, 8);
}
