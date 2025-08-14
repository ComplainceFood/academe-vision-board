import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface OutlookEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  body?: {
    content: string;
  };
  location?: {
    displayName: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Outlook integration settings
    const { data: integration, error: integrationError } = await supabase
      .from('outlook_integration')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Outlook integration not found or not connected' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    let accessToken = integration.access_token_encrypted;
    const tokenExpiresAt = new Date(integration.token_expires_at);
    const now = new Date();

    if (tokenExpiresAt <= now) {
      // Refresh the token
      const refreshResult = await refreshAccessToken(integration.refresh_token_encrypted);
      if (!refreshResult) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      accessToken = refreshResult.access_token;
      
      // Update tokens in database
      await supabase
        .from('outlook_integration')
        .update({
          access_token_encrypted: refreshResult.access_token,
          refresh_token_encrypted: refreshResult.refresh_token,
          token_expires_at: new Date(Date.now() + (refreshResult.expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    // Import from Outlook to Supabase
    const importedCount = await importFromOutlookCalendar(user.id, accessToken, supabase);
    
    // Export from Supabase to Outlook
    const exportedCount = await exportToOutlookCalendar(user.id, accessToken, supabase);

    // Update last sync time
    await supabase
      .from('outlook_integration')
      .update({
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: importedCount,
        exported: exportedCount,
        message: `Sync completed: ${importedCount} events imported, ${exportedCount} events exported`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in outlook-calendar-sync:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshAccessToken(refreshToken: string) {
  const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
  const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');
  const MICROSOFT_TENANT_ID = Deno.env.get('MICROSOFT_TENANT_ID');

  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_TENANT_ID) {
    return null;
  }

  const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: 'https://graph.microsoft.com/calendars.readwrite https://graph.microsoft.com/user.read offline_access'
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

async function importFromOutlookCalendar(userId: string, accessToken: string, supabase: any): Promise<number> {
  try {
    // Get events from Outlook Calendar (next 30 days)
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();
    
    const eventsUrl = `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${startDate}' and start/dateTime le '${endDate}'&$orderby=start/dateTime`;
    
    const response = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Outlook events:', await response.text());
      return 0;
    }

    const data = await response.json();
    const events: OutlookEvent[] = data.value || [];

    let importedCount = 0;

    for (const event of events) {
      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('planning_events')
        .select('id')
        .eq('external_id', event.id)
        .eq('external_source', 'outlook')
        .single();

      if (!existingEvent) {
        // Parse the event data
        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        
        // Insert new event
        const { error } = await supabase
          .from('planning_events')
          .insert({
            user_id: userId,
            title: event.subject || 'Untitled Event',
            description: event.body?.content || '',
            type: 'event',
            date: startDate.toISOString().split('T')[0],
            time: startDate.toTimeString().split(' ')[0].substring(0, 5),
            end_time: endDate.toTimeString().split(' ')[0].substring(0, 5),
            location: event.location?.displayName || '',
            external_id: event.id,
            external_source: 'outlook',
            is_synced: true,
            created_at: new Date().toISOString()
          });

        if (!error) {
          importedCount++;
        }
      }
    }

    return importedCount;
  } catch (error) {
    console.error('Import error:', error);
    return 0;
  }
}

async function exportToOutlookCalendar(userId: string, accessToken: string, supabase: any): Promise<number> {
  try {
    // Get unsynced events from Supabase
    const { data: unsyncedEvents, error } = await supabase
      .from('planning_events')
      .select('*')
      .eq('user_id', userId)
      .or('is_synced.is.null,is_synced.eq.false')
      .is('external_source', null);

    if (error || !unsyncedEvents) {
      return 0;
    }

    let exportedCount = 0;

    for (const event of unsyncedEvents) {
      try {
        // Create event in Outlook Calendar
        const startDateTime = new Date(`${event.date}T${event.time || '09:00'}:00`);
        const endDateTime = new Date(`${event.date}T${event.end_time || '10:00'}:00`);

        const outlookEvent = {
          subject: event.title,
          body: {
            contentType: 'text',
            content: event.description || ''
          },
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'UTC'
          },
          location: {
            displayName: event.location || ''
          }
        };

        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(outlookEvent),
        });

        if (response.ok) {
          const createdEvent = await response.json();
          
          // Update the event with Outlook ID and sync status
          await supabase
            .from('planning_events')
            .update({
              external_id: createdEvent.id,
              external_source: 'outlook',
              is_synced: true
            })
            .eq('id', event.id);

          exportedCount++;
        }
      } catch (eventError) {
        console.error('Error exporting individual event:', eventError);
      }
    }

    return exportedCount;
  } catch (error) {
    console.error('Export error:', error);
    return 0;
  }
}