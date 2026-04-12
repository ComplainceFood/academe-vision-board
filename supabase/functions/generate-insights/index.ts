import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Authentication failed');

    // Fetch all relevant data in parallel
    const [
      notesRes,
      meetingsRes,
      suppliesRes,
      eventsRes,
      expensesRes,
      fundingRes,
      achievementsRes,
    ] = await Promise.all([
      supabase.from('notes').select('id,title,type,priority,status,created_at').eq('user_id', user.id),
      supabase.from('meetings').select('id,title,start_date,action_items,is_recurring,status').eq('user_id', user.id),
      supabase.from('supplies').select('id,name,category,current_count,threshold,cost').eq('user_id', user.id),
      supabase.from('planning_events').select('id,title,type,priority,date,completed,course').eq('user_id', user.id),
      supabase.from('expenses').select('id,description,amount,date,category').eq('user_id', user.id),
      supabase.from('funding_sources').select('id,name,type,total_amount,remaining_amount,status,end_date,reporting_requirements').eq('user_id', user.id),
      supabase.from('scholastic_achievements').select('id,category,title,status,date,venue').eq('user_id', user.id),
    ]);

    const data = {
      notes: notesRes.data || [],
      meetings: meetingsRes.data || [],
      supplies: suppliesRes.data || [],
      events: eventsRes.data || [],
      expenses: expensesRes.data || [],
      funding: fundingRes.data || [],
      achievements: achievementsRes.data || [],
    };

    const insights = await generateAIInsights(data);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generate-insights error:', error);
    return new Response(
      JSON.stringify({ error: String(error), insights: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAIInsights(data: any) {
  const summary = buildDataSummary(data);

  if (!GEMINI_API_KEY) {
    console.warn('No GEMINI_API_KEY - returning rule-based insights');
    return { insights: ruleBasedInsights(data) };
  }

  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are an AI assistant for academic professionals (professors, researchers, faculty).
Today's date: ${today}

Analyse the following data snapshot from an academic management platform and produce 4–6 highly specific, actionable insights.

${summary}

Return ONLY valid JSON - no markdown fences, no explanation - in this exact shape:
{
  "insights": [
    {
      "title": "Concise insight title (max 60 chars)",
      "description": "2–3 sentences specific to the data above - reference actual numbers, names, or deadlines where relevant.",
      "action": "One concrete next step the user should take this week.",
      "priority": "high|medium|low",
      "category": "funding|research|tasks|meetings|supplies|productivity"
    }
  ]
}

Priority rules:
- high   → overdue, expiring within 30 days, critically low stock, or many pending action items
- medium → due within 90 days, moderate issues, patterns worth addressing
- low    → optimisation opportunities, long-term recommendations

Coverage: cover a diverse set of categories; do not generate more than 2 insights per category. Be specific - avoid generic advice.`;

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
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Gemini error:', response.status, err);
    return { insights: ruleBasedInsights(data) };
  }

  const result = await response.json();
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON in Gemini response:', text.slice(0, 200));
    return { insights: ruleBasedInsights(data) };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error('JSON parse failed:', jsonMatch[0].slice(0, 200));
    return { insights: ruleBasedInsights(data) };
  }
}

function buildDataSummary(data: any): string {
  const today = new Date();
  const { notes, meetings, supplies, events, expenses, funding, achievements } = data;

  // Notes
  const urgentNotes = notes.filter((n: any) => n.priority === 'urgent').length;
  const activeCommitments = notes.filter((n: any) => n.type === 'commitment' && n.status === 'active').length;
  const recentNotes = notes.filter((n: any) => {
    const d = new Date(n.created_at);
    return (today.getTime() - d.getTime()) < 7 * 24 * 3600 * 1000;
  }).length;

  // Meetings
  const upcomingMeetings = meetings.filter((m: any) => new Date(m.start_date) > today);
  const pendingActionItems = meetings.filter((m: any) => m.action_items?.length > 0).length;
  const nextMeeting = upcomingMeetings.sort((a: any, b: any) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )[0];

  // Supplies
  const lowStock = supplies.filter((s: any) => s.current_count <= s.threshold);
  const outOfStock = supplies.filter((s: any) => s.current_count === 0);
  const lowStockNames = lowStock.slice(0, 5).map((s: any) => `${s.name} (${s.current_count}/${s.threshold})`).join(', ');

  // Planning events / tasks
  const overdueTasks = events.filter((e: any) => !e.completed && new Date(e.date) < today);
  const urgentTasks = events.filter((e: any) => e.priority === 'urgent' && !e.completed);
  const next14Days = events.filter((e: any) => {
    const d = new Date(e.date);
    const diff = (d.getTime() - today.getTime()) / (24 * 3600 * 1000);
    return diff >= 0 && diff <= 14 && !e.completed;
  });
  const overdueNames = overdueTasks.slice(0, 3).map((e: any) => e.title).join(', ');

  // Expenses
  const totalExpenses = expenses.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0);
  const last30Expenses = expenses.filter((e: any) => {
    const d = new Date(e.date);
    return (today.getTime() - d.getTime()) < 30 * 24 * 3600 * 1000;
  }).reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0);

  // Funding
  const activeGrants = funding.filter((f: any) => f.status === 'active');
  const expiringGrants = funding.filter((f: any) => {
    if (!f.end_date || f.status !== 'active') return false;
    const days = (new Date(f.end_date).getTime() - today.getTime()) / (24 * 3600 * 1000);
    return days >= 0 && days <= 90;
  });
  const depletingGrants = activeGrants.filter((f: any) => {
    if (!f.total_amount || f.total_amount === 0) return false;
    return (parseFloat(f.remaining_amount) / parseFloat(f.total_amount)) < 0.2;
  });
  const totalFunding = activeGrants.reduce((s: number, f: any) => s + parseFloat(f.remaining_amount || 0), 0);
  const grantSummary = activeGrants.slice(0, 4).map((f: any) => {
    const pct = f.total_amount > 0 ? Math.round((f.remaining_amount / f.total_amount) * 100) : 0;
    return `${f.name} (${pct}% remaining${f.end_date ? ', ends ' + f.end_date : ''})`;
  }).join('; ');

  // Achievements
  const inProgressWork = achievements.filter((a: any) => ['in_progress', 'submitted'].includes(a.status));
  const recentPublished = achievements.filter((a: any) => {
    if (a.status !== 'published' && a.status !== 'completed') return false;
    const d = new Date(a.date);
    return (today.getTime() - d.getTime()) < 180 * 24 * 3600 * 1000;
  });
  const byCategory = achievements.reduce((acc: any, a: any) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  return `=== NOTES & COMMITMENTS ===
Total notes: ${notes.length} | Urgent: ${urgentNotes} | Active commitments: ${activeCommitments} | Added this week: ${recentNotes}

=== MEETINGS ===
Total: ${meetings.length} | Upcoming: ${upcomingMeetings.length} | Pending action items from past meetings: ${pendingActionItems}
Next meeting: ${nextMeeting ? `"${nextMeeting.title}" on ${nextMeeting.start_date}` : 'None scheduled'}

=== SUPPLIES & INVENTORY ===
Total items: ${supplies.length} | Low stock: ${lowStock.length} | Out of stock: ${outOfStock.length}
${lowStock.length > 0 ? `Low stock items: ${lowStockNames}` : 'All supplies adequately stocked'}

=== TASKS & PLANNING ===
Total events/tasks: ${events.length} | Overdue (incomplete): ${overdueTasks.length} | Urgent & pending: ${urgentTasks.length} | Due in next 14 days: ${next14Days.length}
${overdueTasks.length > 0 ? `Overdue items: ${overdueNames}` : 'No overdue tasks'}

=== EXPENSES ===
Total recorded: $${totalExpenses.toFixed(2)} across ${expenses.length} entries | Last 30 days: $${last30Expenses.toFixed(2)}

=== FUNDING & GRANTS ===
Total funding sources: ${funding.length} | Active grants: ${activeGrants.length} | Total remaining budget: $${totalFunding.toFixed(2)}
${expiringGrants.length > 0 ? `⚠ Grants expiring within 90 days: ${expiringGrants.map((f: any) => f.name).join(', ')}` : 'No grants expiring soon'}
${depletingGrants.length > 0 ? `⚠ Grants below 20% remaining: ${depletingGrants.map((f: any) => f.name).join(', ')}` : ''}
${grantSummary ? `Grant details: ${grantSummary}` : ''}

=== SCHOLASTIC ACHIEVEMENTS ===
Total achievements: ${achievements.length} | In progress/submitted: ${inProgressWork.length} | Published/completed (last 6 months): ${recentPublished.length}
By category: ${Object.entries(byCategory).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None yet'}
${inProgressWork.length > 0 ? `In progress: ${inProgressWork.slice(0, 3).map((a: any) => `"${a.title}" (${a.status})`).join('; ')}` : ''}`;
}

// Rule-based fallback when Gemini is unavailable
function ruleBasedInsights(data: any): any[] {
  const today = new Date();
  const insights: any[] = [];

  const { notes, meetings, supplies, events, expenses, funding, achievements } = data;

  // Funding insights
  const expiringGrants = funding.filter((f: any) => {
    if (!f.end_date || f.status !== 'active') return false;
    const days = (new Date(f.end_date).getTime() - today.getTime()) / (24 * 3600 * 1000);
    return days >= 0 && days <= 90;
  });
  if (expiringGrants.length > 0) {
    insights.push({
      title: `${expiringGrants.length} Grant(s) Expiring Soon`,
      description: `${expiringGrants.map((f: any) => f.name).join(', ')} expire within 90 days. Ensure reporting requirements are met and budgets are fully utilised.`,
      action: 'Review reporting requirements and check remaining fund utilisation for expiring grants.',
      priority: 'high',
      category: 'funding',
    });
  }

  const depletingGrants = funding.filter((f: any) => {
    if (!f.total_amount || f.status !== 'active') return false;
    return (parseFloat(f.remaining_amount) / parseFloat(f.total_amount)) < 0.2;
  });
  if (depletingGrants.length > 0) {
    insights.push({
      title: 'Grant Funds Running Low',
      description: `${depletingGrants.map((f: any) => f.name).join(', ')} have less than 20% remaining. Plan expenditures carefully.`,
      action: 'Review remaining expenses and submit any pending purchases before funds deplete.',
      priority: 'high',
      category: 'funding',
    });
  }

  // Tasks insights
  const overdue = events.filter((e: any) => !e.completed && new Date(e.date) < today);
  if (overdue.length > 0) {
    insights.push({
      title: `${overdue.length} Overdue Task(s)`,
      description: `You have ${overdue.length} incomplete tasks past their due date: ${overdue.slice(0, 3).map((e: any) => e.title).join(', ')}.`,
      action: 'Address overdue tasks or reschedule them with updated deadlines.',
      priority: 'high',
      category: 'tasks',
    });
  }

  // Supplies insights
  const lowStock = supplies.filter((s: any) => s.current_count <= s.threshold);
  if (lowStock.length > 0) {
    insights.push({
      title: `${lowStock.length} Supply Item(s) Need Restocking`,
      description: `${lowStock.slice(0, 4).map((s: any) => s.name).join(', ')} are at or below restock thresholds.`,
      action: 'Place restock orders for low-stock supplies, especially before upcoming lab sessions.',
      priority: lowStock.length > 3 ? 'high' : 'medium',
      category: 'supplies',
    });
  }

  // Meeting action items
  const withActions = meetings.filter((m: any) => m.action_items?.length > 0);
  if (withActions.length > 2) {
    insights.push({
      title: 'Pending Meeting Action Items',
      description: `${withActions.length} meetings have unresolved action items. Unaddressed action items can stall collaboration.`,
      action: 'Review action items from recent meetings and mark completed ones as done.',
      priority: 'medium',
      category: 'meetings',
    });
  }

  // Achievements in progress
  const inProgress = achievements.filter((a: any) => ['in_progress', 'submitted'].includes(a.status));
  if (inProgress.length > 0) {
    insights.push({
      title: `${inProgress.length} Research Work(s) In Progress`,
      description: `You have ${inProgress.length} active scholarly works (${inProgress.slice(0, 2).map((a: any) => `"${a.title}"`).join(', ')}).`,
      action: 'Update status on in-progress works and set target completion dates if not already set.',
      priority: 'medium',
      category: 'research',
    });
  }

  // Default
  if (insights.length === 0) {
    insights.push({
      title: 'Great Academic Profile Setup',
      description: 'Your academic management platform is set up. Add more data across modules to receive personalised AI insights.',
      action: 'Start by logging recent meetings, uploading supply inventory, or recording a scholastic achievement.',
      priority: 'low',
      category: 'productivity',
    });
  }

  return insights;
}
