import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { grant, expenditures, meetings, notes, narrative_type } = await req.json();

    if (!grant?.name) {
      return new Response(
        JSON.stringify({ error: 'Grant information is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify(buildFallback(grant)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from grant data
    const totalBudget = grant.total_amount || 0;
    const totalSpent = expenditures?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;
    const remaining = totalBudget - totalSpent;
    const spentPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const expendituresByCategory = expenditures?.reduce((acc: any, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
      return acc;
    }, {}) || {};

    const recentMeetingTitles = meetings?.slice(0, 5).map((m: any) => m.title).join(', ') || 'None';
    const notesSummary = notes?.slice(0, 5).map((n: any) => n.title).join(', ') || 'None';

    const narrativeTypeLabel = narrative_type === 'progress_report' ? 'Progress Report'
      : narrative_type === 'budget_justification' ? 'Budget Justification'
      : 'Executive Summary';

    const prompt = `You are an expert grant writing assistant for academic researchers. Generate a professional ${narrativeTypeLabel} for the following grant.

GRANT INFORMATION:
- Name: ${grant.name}
- Type: ${grant.type || 'Research Grant'}
- Funding Agency/Contact: ${grant.contact_person || grant.contact_email || 'Not specified'}
- Total Budget: $${totalBudget.toLocaleString()}
- Amount Spent: $${totalSpent.toLocaleString()} (${spentPercent}%)
- Remaining: $${remaining.toLocaleString()}
- Status: ${grant.status || 'Active'}
- Start Date: ${grant.start_date || 'Not specified'}
- End Date: ${grant.end_date || 'Not specified'}
- Description: ${grant.description || 'No description provided'}

EXPENDITURE BREAKDOWN:
${Object.entries(expendituresByCategory).map(([cat, amt]) => `- ${cat}: $${(amt as number).toLocaleString()}`).join('\n') || '- No expenditures recorded'}

RECENT MEETINGS: ${recentMeetingTitles}
RECENT NOTES/ACTIVITIES: ${notesSummary}

Generate a ${narrativeTypeLabel} and respond ONLY with valid JSON:
{
  "narrative": "Professional 3-5 paragraph narrative text suitable for ${narrativeTypeLabel}",
  "key_accomplishments": ["Accomplishment 1", "Accomplishment 2", "Accomplishment 3"],
  "next_steps": ["Next step 1", "Next step 2", "Next step 3"],
  "budget_note": "1-2 sentence budget status summary",
  "risk_flags": ["Any concern or flag if applicable"]
}

Guidelines:
- Write in formal academic/grant reporting style
- For Progress Report: focus on activities completed, milestones reached, and outcomes
- For Budget Justification: explain spending categories and demonstrate appropriate use of funds
- For Executive Summary: give a high-level overview of grant purpose, progress, and impact
- Keep tone professional and results-oriented
- If budget is >80% spent with time remaining, flag as a risk
- Use specific numbers from the data provided`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generate-grant-narrative error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate grant narrative' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildFallback(grant: any) {
  return {
    narrative: `This report covers the progress of ${grant.name}. Activities have been conducted in accordance with the grant objectives. Expenditures have been managed responsibly within the approved budget framework.`,
    key_accomplishments: ['Grant activities initiated', 'Budget tracking established', 'Team coordination underway'],
    next_steps: ['Continue project activities', 'Monitor budget utilization', 'Document outcomes'],
    budget_note: 'Budget utilization is being monitored regularly.',
    risk_flags: [],
  };
}
