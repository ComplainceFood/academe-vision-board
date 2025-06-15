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

    // Generate insights based on data (no OpenAI needed)
    const insights = {
      insights: [
        {
          title: "Review Meeting Follow-ups",
          description: `You have ${dataContext.meetings.length} meetings recorded. Consider reviewing action items and follow-up tasks.`,
          action: "Go through your meeting notes and create tasks for any pending action items",
          priority: dataContext.meetings.length > 5 ? "high" : "medium",
          category: "meetings"
        },
        {
          title: "Inventory Management",
          description: `Track ${dataContext.supplies.length} supply items. ${dataContext.supplies.filter(s => s.current_count <= s.threshold).length} items may need restocking.`,
          action: dataContext.supplies.filter(s => s.current_count <= s.threshold).length > 0 
            ? "Check and restock low inventory items" 
            : "Continue monitoring inventory levels",
          priority: dataContext.supplies.filter(s => s.current_count <= s.threshold).length > 0 ? "high" : "low",
          category: "supplies"
        },
        {
          title: "Task Organization",
          description: `${dataContext.events.filter(e => e.type === 'task' && !e.completed).length} pending tasks and ${dataContext.events.length} total events planned.`,
          action: "Review and prioritize your upcoming tasks and deadlines",
          priority: dataContext.events.filter(e => e.type === 'task' && !e.completed).length > 3 ? "high" : "medium",
          category: "tasks"
        },
        {
          title: "Shopping List Review",
          description: `${dataContext.shopping.filter(s => !s.purchased).length} items in your shopping list awaiting purchase.`,
          action: dataContext.shopping.filter(s => !s.purchased).length > 0 
            ? "Review and purchase pending shopping list items" 
            : "Your shopping list is up to date",
          priority: dataContext.shopping.filter(s => !s.purchased).length > 5 ? "medium" : "low",
          category: "supplies"
        }
      ]
    };

    console.log('Generated insights successfully');
    
    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    
    // Always return fallback insights on any error
    const fallbackInsights = {
      insights: [
        {
          title: "System Ready",
          description: "Your academia management system is ready to help you stay organized",
          action: "Start by adding some notes, meetings, or supplies to get personalized insights",
          priority: "low",
          category: "system"
        },
        {
          title: "Explore Features",
          description: "Take advantage of the planning, supplies, and meeting management tools",
          action: "Visit different sections to familiarize yourself with available features",
          priority: "low",
          category: "system"
        }
      ]
    };
    
    return new Response(JSON.stringify(fallbackInsights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});