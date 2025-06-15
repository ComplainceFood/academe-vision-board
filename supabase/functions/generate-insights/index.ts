import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`${req.method} request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasOpenAIKey: !!openAIApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log('User authenticated:', user.id);

    // Test database connection with a simple query first
    const { data: testData, error: testError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (testError) {
      console.error('Database connection test failed:', testError);
    } else {
      console.log('Database connection successful');
    }

    // Fetch user's data for analysis - using service role so RLS shouldn't be an issue
    console.log('Fetching data for user:', user.id);
    
    const [notesResult, meetingsResult, suppliesResult, eventsResult, shoppingResult] = await Promise.all([
      supabaseClient.from('notes').select('*').eq('user_id', user.id),
      supabaseClient.from('meetings').select('*').eq('user_id', user.id),
      supabaseClient.from('supplies').select('*').eq('user_id', user.id),
      supabaseClient.from('planning_events').select('*').eq('user_id', user.id),
      supabaseClient.from('shopping_list').select('*').eq('user_id', user.id)
    ]);

    // Check for database errors
    const dbErrors = [];
    if (notesResult.error) dbErrors.push(`Notes: ${notesResult.error.message}`);
    if (meetingsResult.error) dbErrors.push(`Meetings: ${meetingsResult.error.message}`);
    if (suppliesResult.error) dbErrors.push(`Supplies: ${suppliesResult.error.message}`);
    if (eventsResult.error) dbErrors.push(`Events: ${eventsResult.error.message}`);
    if (shoppingResult.error) dbErrors.push(`Shopping: ${shoppingResult.error.message}`);
    
    if (dbErrors.length > 0) {
      console.error('Database errors:', dbErrors);
      throw new Error(`Database queries failed: ${dbErrors.join(', ')}`);
    }
    
    const dataContext = {
      notes: notesResult.data || [],
      meetings: meetingsResult.data || [],
      supplies: suppliesResult.data || [],
      events: eventsResult.data || [],
      shopping: shoppingResult.data || []
    };
    
    console.log('Data fetched successfully:', {
      notes: dataContext.notes.length,
      meetings: dataContext.meetings.length,
      supplies: dataContext.supplies.length,
      events: dataContext.events.length,
      shopping: dataContext.shopping.length
    });

    // Create AI prompt
    const prompt = `You are an AI assistant analyzing academic teaching data. Based on the following data, provide 3-4 actionable insights that help improve teaching efficiency and organization.

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

Focus on practical, actionable advice for academic efficiency.`;

    console.log('Calling OpenAI API...');
    
    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes academic data and provides actionable insights. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const aiData = await response.json();
    console.log('OpenAI response received');
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      console.error('Invalid OpenAI response structure:', aiData);
      throw new Error('Invalid response from OpenAI API');
    }

    let insights;
    try {
      const content = aiData.choices[0].message.content;
      console.log('AI content:', content);
      insights = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiData.choices[0].message.content);
      
      // Fallback insights based on actual data
      insights = {
        insights: [
          {
            title: "Follow Up on Meeting Action Items",
            description: `You have ${dataContext.meetings.length} meetings with potential follow-up actions`,
            action: "Review your meeting notes and follow up on pending action items with students",
            priority: "medium",
            category: "meetings"
          },
          {
            title: "Data Entry Opportunity",
            description: "Your system has limited data for comprehensive analysis",
            action: "Add more notes, supplies, and planning events to get more personalized insights",
            priority: "low",
            category: "system"
          }
        ]
      };
    }

    console.log('Returning insights:', insights);
    
    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});