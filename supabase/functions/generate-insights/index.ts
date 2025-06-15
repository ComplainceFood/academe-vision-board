import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch user's data for analysis
    const [notesData, meetingsData, suppliesData, eventsData, shoppingData] = await Promise.all([
      supabaseClient.from('notes').select('*').eq('user_id', user.id),
      supabaseClient.from('meetings').select('*').eq('user_id', user.id),
      supabaseClient.from('supplies').select('*').eq('user_id', user.id),
      supabaseClient.from('planning_events').select('*').eq('user_id', user.id),
      supabaseClient.from('shopping_list').select('*').eq('user_id', user.id)
    ]);

    // Prepare data summary for AI analysis
    const dataContext = {
      notes: notesData.data || [],
      meetings: meetingsData.data || [],
      supplies: suppliesData.data || [],
      events: eventsData.data || [],
      shopping: shoppingData.data || []
    };

    // Create prompt for AI analysis
    const prompt = `
    You are an AI assistant analyzing academic teaching data. Based on the following data, provide 3-4 actionable insights that help improve teaching efficiency and organization.

    Data Summary:
    - Notes (${dataContext.notes.length} total): ${dataContext.notes.filter(n => n.type === 'promise').length} promises to students
    - Meetings: ${dataContext.meetings.length} total, ${dataContext.meetings.filter(m => m.status === 'scheduled' && new Date(m.date) > new Date()).length} upcoming
    - Supplies: ${dataContext.supplies.length} items, ${dataContext.supplies.filter(s => s.current_count <= s.threshold).length} below threshold
    - Events: ${dataContext.events.length} total, ${dataContext.events.filter(e => e.type === 'task' && !e.completed).length} pending tasks
    - Shopping List: ${dataContext.shopping.filter(s => !s.purchased).length} items to purchase

    Provide insights in this JSON format:
    {
      "insights": [
        {
          "title": "Clear actionable title",
          "description": "Brief explanation of the insight",
          "action": "Specific action to take",
          "priority": "high|medium|low",
          "category": "supplies|meetings|tasks|promises"
        }
      ]
    }

    Focus on practical, actionable advice for academic efficiency.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes academic data and provides actionable insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    const aiData = await response.json();
    const insights = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});