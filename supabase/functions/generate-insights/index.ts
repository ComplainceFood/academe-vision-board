import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  console.log(`${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting insights generation...');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Authentication failed');
    }
    
    console.log('User authenticated:', user.id);

    // Fetch data with RLS disabled
    console.log('Fetching user data...');
    
    const [notesResult, meetingsResult, suppliesResult, eventsResult, shoppingResult] = await Promise.all([
      supabaseClient.from('notes').select('*').eq('user_id', user.id),
      supabaseClient.from('meetings').select('*').eq('user_id', user.id),
      supabaseClient.from('supplies').select('*').eq('user_id', user.id),
      supabaseClient.from('planning_events').select('*').eq('user_id', user.id),
      supabaseClient.from('shopping_list').select('*').eq('user_id', user.id)
    ]);

    console.log('Database queries completed');
    
    const dataContext = {
      notes: notesResult.data || [],
      meetings: meetingsResult.data || [],
      supplies: suppliesResult.data || [],
      events: eventsResult.data || [],
      shopping: shoppingResult.data || []
    };
    
    console.log('Data summary:', {
      notes: dataContext.notes.length,
      meetings: dataContext.meetings.length,
      supplies: dataContext.supplies.length,
      events: dataContext.events.length,
      shopping: dataContext.shopping.length
    });

    // Generate AI-powered insights using Gemini
    const insights = await generateAIInsights(dataContext);

    console.log('Generated AI insights successfully');
    
    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    
    // Try to generate fallback insights with basic analysis
    try {
      const { data } = await req.json().catch(() => ({}));
      const fallbackInsights = await generateFallbackInsights(data);
      return new Response(JSON.stringify(fallbackInsights), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fallbackError) {
      console.error('Fallback insights failed:', fallbackError);
      return generateBasicFallback();
    }
  }
});

// Generate AI insights using Gemini API
async function generateAIInsights(dataContext: any) {
  if (!GEMINI_API_KEY) {
    console.log('No Gemini API key, using fallback insights');
    return generateFallbackInsights(dataContext);
  }

  try {
    // Prepare data summary for AI analysis
    const dataSummary = createDataSummary(dataContext);
    
    const prompt = `As an AI assistant for academic professionals, analyze the following data and generate 3-5 actionable insights. Focus on productivity, time management, resource optimization, and academic excellence.

Data Summary:
${dataSummary}

Generate insights in JSON format with this structure:
{
  "insights": [
    {
      "title": "Brief insight title",
      "description": "Detailed description of the insight",
      "action": "Specific actionable recommendation",
      "priority": "high|medium|low",
      "category": "meetings|supplies|tasks|planning|productivity"
    }
  ]
}

Guidelines:
- Be specific and actionable
- Focus on productivity improvements
- Identify patterns and trends
- Suggest concrete next steps
- Prioritize based on urgency and impact
- Keep descriptions concise but informative`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.candidates[0]?.content?.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated from Gemini');
    }

    // Parse the JSON response from Gemini
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }

    const insights = JSON.parse(jsonMatch[0]);
    console.log('Gemini insights generated successfully');
    return insights;

  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackInsights(dataContext);
  }
}

// Create a comprehensive data summary for AI analysis
function createDataSummary(dataContext: any) {
  const { notes, meetings, supplies, events, shopping } = dataContext;
  
  // Analyze notes
  const noteStats = {
    total: notes.length,
    active: notes.filter((n: any) => n.status === 'active').length,
    urgent: notes.filter((n: any) => n.priority === 'urgent').length,
    commitments: notes.filter((n: any) => n.type === 'commitment').length,
    recent: notes.filter((n: any) => {
      const created = new Date(n.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length
  };

  // Analyze meetings
  const meetingStats = {
    total: meetings.length,
    upcoming: meetings.filter((m: any) => new Date(m.start_date) > new Date()).length,
    withActionItems: meetings.filter((m: any) => m.action_items && m.action_items.length > 0).length,
    recurring: meetings.filter((m: any) => m.is_recurring).length
  };

  // Analyze supplies
  const supplyStats = {
    total: supplies.length,
    lowStock: supplies.filter((s: any) => s.current_count <= s.threshold).length,
    categories: [...new Set(supplies.map((s: any) => s.category))],
    totalValue: supplies.reduce((sum: number, s: any) => sum + (s.cost * s.current_count), 0)
  };

  // Analyze events and tasks
  const eventStats = {
    total: events.length,
    upcoming: events.filter((e: any) => new Date(e.date) > new Date()).length,
    overdue: events.filter((e: any) => new Date(e.date) < new Date() && !e.completed).length,
    urgent: events.filter((e: any) => e.priority === 'urgent').length
  };

  // Analyze shopping list
  const shoppingStats = {
    total: shopping.length,
    pending: shopping.filter((s: any) => !s.purchased).length,
    highPriority: shopping.filter((s: any) => s.priority === 'high').length
  };

  return `
NOTES & COMMITMENTS:
- Total notes: ${noteStats.total}
- Active notes: ${noteStats.active}
- Urgent items: ${noteStats.urgent}
- Commitments: ${noteStats.commitments}
- Recent notes (last 7 days): ${noteStats.recent}

MEETINGS:
- Total meetings: ${meetingStats.total}
- Upcoming meetings: ${meetingStats.upcoming}
- Meetings with action items: ${meetingStats.withActionItems}
- Recurring meetings: ${meetingStats.recurring}

SUPPLIES & INVENTORY:
- Total supply items: ${supplyStats.total}
- Low stock items: ${supplyStats.lowStock}
- Supply categories: ${supplyStats.categories.join(', ')}
- Total inventory value: $${supplyStats.totalValue.toFixed(2)}

PLANNING & TASKS:
- Total events/tasks: ${eventStats.total}
- Upcoming events: ${eventStats.upcoming}
- Overdue tasks: ${eventStats.overdue}
- Urgent tasks: ${eventStats.urgent}

SHOPPING LIST:
- Total items: ${shoppingStats.total}
- Pending purchases: ${shoppingStats.pending}
- High priority items: ${shoppingStats.highPriority}

RECENT ACTIVITY PATTERNS:
${notes.length > 0 ? `- Most recent note: ${notes[0]?.title || 'N/A'}` : '- No notes recorded'}
${meetings.length > 0 ? `- Next meeting: ${meetings.find((m: any) => new Date(m.start_date) > new Date())?.title || 'None scheduled'}` : '- No meetings scheduled'}
${supplies.length > 0 && supplyStats.lowStock > 0 ? `- Supplies needing attention: ${supplies.filter((s: any) => s.current_count <= s.threshold).map((s: any) => s.name).join(', ')}` : '- All supplies adequately stocked'}
  `;
}

// Generate fallback insights when AI is unavailable
function generateFallbackInsights(dataContext: any) {
  const { notes, meetings, supplies, events, shopping } = dataContext || {};
  
  const insights = [];

  // Meeting insights
  if (meetings?.length > 0) {
    const upcomingMeetings = meetings.filter((m: any) => new Date(m.start_date) > new Date());
    const actionItems = meetings.filter((m: any) => m.action_items && m.action_items.length > 0);
    
    insights.push({
      title: "Meeting Management Review",
      description: `You have ${meetings.length} meetings recorded with ${upcomingMeetings.length} upcoming. ${actionItems.length} meetings have pending action items.`,
      action: actionItems.length > 0 ? "Review and follow up on pending action items from recent meetings" : "Continue maintaining good meeting documentation",
      priority: actionItems.length > 2 ? "high" : "medium",
      category: "meetings"
    });
  }

  // Supply insights
  if (supplies?.length > 0) {
    const lowStock = supplies.filter((s: any) => s.current_count <= s.threshold);
    insights.push({
      title: "Inventory Status Check",
      description: `Monitoring ${supplies.length} supply items. ${lowStock.length} items are at or below restock threshold.`,
      action: lowStock.length > 0 ? `Restock the following items: ${lowStock.map((s: any) => s.name).slice(0, 3).join(', ')}` : "Inventory levels are healthy",
      priority: lowStock.length > 0 ? "high" : "low",
      category: "supplies"
    });
  }

  // Task insights
  if (events?.length > 0) {
    const overdue = events.filter((e: any) => new Date(e.date) < new Date() && !e.completed);
    const urgent = events.filter((e: any) => e.priority === 'urgent' && !e.completed);
    
    insights.push({
      title: "Task & Event Planning",
      description: `${events.length} total events planned. ${overdue.length} overdue tasks, ${urgent.length} urgent items pending.`,
      action: overdue.length > 0 ? "Address overdue tasks immediately" : "Review upcoming deadlines and priorities",
      priority: overdue.length > 0 ? "high" : "medium",
      category: "tasks"
    });
  }

  // Notes insights
  if (notes?.length > 0) {
    const activeCommitments = notes.filter((n: any) => n.type === 'commitment' && n.status === 'active');
    const urgentNotes = notes.filter((n: any) => n.priority === 'urgent');
    
    insights.push({
      title: "Notes & Commitments Review",
      description: `${notes.length} notes recorded with ${activeCommitments.length} active commitments and ${urgentNotes.length} urgent items.`,
      action: urgentNotes.length > 0 ? "Review and address urgent notes and commitments" : "Continue documenting important information",
      priority: urgentNotes.length > 0 ? "high" : "medium",
      category: "productivity"
    });
  }

  // Default insight if no data
  if (insights.length === 0) {
    insights.push({
      title: "Getting Started",
      description: "Your academic management system is ready to help you stay organized and productive.",
      action: "Start by adding some notes, scheduling meetings, or tracking supplies to get personalized insights",
      priority: "low",
      category: "system"
    });
  }

  return { insights };
}

// Generate basic fallback when everything else fails
function generateBasicFallback() {
  const basicInsights = {
    insights: [
      {
        title: "System Ready",
        description: "Your academia management system is ready to help you stay organized",
        action: "Start by adding some data to get personalized insights",
        priority: "low",
        category: "system"
      }
    ]
  };
  
  return new Response(JSON.stringify(basicInsights), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}