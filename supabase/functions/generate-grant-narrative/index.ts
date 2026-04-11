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
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
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
  const totalBudget = parseFloat(grant.total_amount || 0);
  const remaining = parseFloat(grant.remaining_amount || 0);
  const spent = totalBudget - remaining;
  const spentPct = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
  const riskFlags: string[] = [];
  if (spentPct > 80 && grant.end_date) {
    const daysLeft = Math.round((new Date(grant.end_date).getTime() - Date.now()) / (24 * 3600 * 1000));
    if (daysLeft > 30) riskFlags.push(`${spentPct}% of budget expended with ${daysLeft} days remaining — review remaining expenditures.`);
  }
  if (grant.reporting_requirements) riskFlags.push(`Reporting requirement on file: ${grant.reporting_requirements}`);
  return {
    narrative: `${grant.name} (${grant.type || 'grant'}) is currently ${grant.status}. The total awarded budget is $${totalBudget.toLocaleString()}, of which $${spent.toLocaleString()} (${spentPct}%) has been expended, leaving $${remaining.toLocaleString()} in available funds${grant.end_date ? ' through ' + grant.end_date : ''}.\n\nActivities have been conducted in alignment with the stated grant objectives. All expenditures have been tracked and managed within approved categories in accordance with compliance requirements.\n\nContinued monitoring of budget utilisation and progress milestones is underway. Required reporting will be submitted per the grant agreement terms.`,
    key_accomplishments: [
      `${grant.name} is active with ${spentPct}% of budget utilised`,
      `$${spent.toLocaleString()} expended across tracked expense categories`,
      `$${remaining.toLocaleString()} remaining for continued project activities`,
    ],
    next_steps: [
      `Monitor remaining $${remaining.toLocaleString()} in grant funds`,
      grant.end_date ? `Prepare for grant end date: ${grant.end_date}` : 'Review grant timeline and milestones',
      grant.reporting_requirements ? `Submit required report: ${grant.reporting_requirements}` : 'Document outcomes for final reporting',
    ],
    budget_note: `$${spent.toLocaleString()} of $${totalBudget.toLocaleString()} expended (${spentPct}%). $${remaining.toLocaleString()} remaining.`,
    risk_flags: riskFlags,
  };
}
