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
    console.log('🔄 Starting Outlook calendar sync...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👤 Syncing for user: ${user.id}`);

    // 🔍 DEBUGGING: Get and analyze Outlook integration settings
    console.log('🔍 Fetching Outlook integration data...');
    const { data: integration, error: integrationError } = await supabase
      .from('outlook_integration')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (integrationError) {
      console.error('❌ Database error fetching integration:', {
        error: integrationError.message,
        code: integrationError.code,
        details: integrationError.details,
        userId: user.id
      });
      return new Response(
        JSON.stringify({ error: 'Database error', details: integrationError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔍 DEBUGGING: Analyze integration data in detail
    console.log('📊 Integration data analysis:', {
      found: !!integration,
      isConnected: integration?.is_connected,
      hasAccessToken: !!integration?.access_token_encrypted,
      hasRefreshToken: !!integration?.refresh_token_encrypted,
      tokenExpiresAt: integration?.token_expires_at,
      lastSync: integration?.last_sync,
      autoSyncEnabled: integration?.auto_sync_enabled,
      syncFrequency: integration?.sync_frequency,
      createdAt: integration?.created_at,
      updatedAt: integration?.updated_at,
      accessTokenPreview: integration?.access_token_encrypted ? `${integration.access_token_encrypted.substring(0, 10)}...${integration.access_token_encrypted.substring(integration.access_token_encrypted.length - 10)}` : 'N/A',
      refreshTokenPreview: integration?.refresh_token_encrypted ? `${integration.refresh_token_encrypted.substring(0, 10)}...${integration.refresh_token_encrypted.substring(integration.refresh_token_encrypted.length - 10)}` : 'N/A'
    });

    if (!integration) {
      console.error('❌ No Outlook integration record found for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Outlook integration not found - please connect your account first' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.is_connected) {
      console.error('❌ Outlook integration exists but is not connected:', integration.is_connected);
      return new Response(
        JSON.stringify({ error: 'Outlook integration is not connected - please reconnect your account' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.access_token_encrypted) {
      console.error('❌ No access token found in integration record');
      return new Response(
        JSON.stringify({ error: 'No access token found - please reconnect your account' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Integration found and appears valid, checking token expiration...');

    // Check if token needs refresh
    let accessToken = integration.access_token_encrypted;
    const tokenExpiresAt = new Date(integration.token_expires_at);
    const now = new Date();
    // Add 5 minute buffer to prevent edge cases
    const bufferTime = new Date(tokenExpiresAt.getTime() - 5 * 60 * 1000);

    console.log(`🕒 Token expires at: ${tokenExpiresAt.toISOString()}, Current time: ${now.toISOString()}, Buffer time: ${bufferTime.toISOString()}`);

    if (bufferTime <= now) {
      console.log('🔄 Token expired, attempting to refresh...');
      
      // Refresh the token
      const refreshResult = await refreshAccessToken(integration.refresh_token_encrypted);
      if (!refreshResult) {
        console.error('❌ Failed to refresh access token');
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token - please reconnect your Outlook account' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Token refreshed successfully');
      accessToken = refreshResult.access_token;
      
      // Update tokens in database
      await supabase
        .from('outlook_integration')
        .update({
          access_token_encrypted: refreshResult.access_token,
          refresh_token_encrypted: refreshResult.refresh_token || integration.refresh_token_encrypted,
          token_expires_at: new Date(Date.now() + (refreshResult.expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      console.log('✅ Token is still valid');
    }

    // Import from Outlook to Supabase
    console.log('📥 Starting import from Outlook...');
    console.log('🔍 Import Debug - User ID:', user.id);
    console.log('🔍 Import Debug - Access Token Length:', accessToken?.length || 0);
    console.log('🔍 Import Debug - Access Token Preview:', accessToken ? `${accessToken.substring(0, 50)}...` : 'NO TOKEN');
    
    const importedCount = await importFromOutlookCalendar(user.id, accessToken, supabase);
    console.log(`📥 Imported ${importedCount} events from Outlook`);
    
    // Export from Supabase to Outlook
    console.log('📤 Starting export to Outlook...');
    const exportedCount = await exportToOutlookCalendar(user.id, accessToken, supabase);
    console.log(`📤 Exported ${exportedCount} events to Outlook`);

    // Update last sync time
    await supabase
      .from('outlook_integration')
      .update({
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    const message = `Sync completed successfully! ${importedCount} events imported from Outlook, ${exportedCount} events exported to Outlook.`;
    console.log(`✅ ${message}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: importedCount,
        exported: exportedCount,
        message: message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in outlook-calendar-sync:', error);
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

  console.log('🔑 Attempting token refresh...');

  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_TENANT_ID) {
    console.error('❌ Missing Microsoft OAuth credentials');
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
    console.log('🌐 Making token refresh request to Microsoft...');
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token refresh failed:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    console.log('✅ Token refresh successful');
    return result;
  } catch (error) {
    console.error('💥 Token refresh error:', error);
    return null;
  }
}

async function importFromOutlookCalendar(userId: string, accessToken: string, supabase: any): Promise<number> {
  try {
    console.log('🔍 Fetching events from Outlook calendar...');
    console.log('🔍 Import function called with:');
    console.log('  - User ID:', userId);
    console.log('  - Access Token exists:', !!accessToken);
    console.log('  - Access Token length:', accessToken?.length || 0);
    
    // Get events from Outlook Calendar (last 30 days + next 60 days for broader range)
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();
    const endDate = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)).toISOString();
    
    const eventsUrl = `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${startDate}' and start/dateTime le '${endDate}'&$orderby=start/dateTime&$top=50`;
    
    console.log('🌐 Making Microsoft Graph API request:', {
      url: eventsUrl,
      method: 'GET',
      accessTokenPreview: `${accessToken.substring(0, 20)}...${accessToken.substring(accessToken.length - 10)}`,
      accessTokenLength: accessToken.length,
      hasBearer: accessToken.includes('Bearer'),
      startDate,
      endDate
    });
    
    // Clean the access token - remove any Bearer prefix if present
    const cleanToken = accessToken.replace(/^Bearer\s+/i, '');
    
    const requestHeaders = {
      'Authorization': `Bearer ${cleanToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    console.log('📤 Request headers:', {
      hasAuthorization: !!requestHeaders.Authorization,
      authHeaderPreview: `${requestHeaders.Authorization.substring(0, 30)}...`,
      contentType: requestHeaders['Content-Type']
    });
    
    const response = await fetch(eventsUrl, {
      method: 'GET',
      headers: requestHeaders,
    });

    console.log('📥 Microsoft Graph API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      
      try {
        errorJson = JSON.parse(errorText);
        console.error('❌ Microsoft Graph API error (parsed):', {
          status: response.status,
          statusText: response.statusText,
          error: errorJson,
          errorCode: errorJson?.error?.code,
          errorMessage: errorJson?.error?.message,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error('❌ Microsoft Graph API error (raw):', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          timestamp: new Date().toISOString()
        });
      }
      
      // Special handling for 401 Unauthorized
      if (response.status === 401) {
        console.error('🔐 AUTHENTICATION FAILED - Token may be invalid, expired, or have wrong permissions!');
        console.error('🔍 Token analysis:', {
          originalTokenLength: accessToken.length,
          cleanTokenLength: cleanToken.length,
          startsWithBearer: accessToken.startsWith('Bearer'),
          tokenFormat: cleanToken.includes('.') ? 'JWT-like' : 'Opaque',
          tokenParts: cleanToken.split('.').length,
          tokenPreview: `${cleanToken.substring(0, 20)}...${cleanToken.substring(cleanToken.length - 10)}`
        });
        
        // Try to refresh token if this is a 401
        console.log('🔄 Attempting to refresh token due to 401 error...');
        const refreshResult = await refreshAccessToken(integration.refresh_token_encrypted);
        if (refreshResult) {
          console.log('✅ Token refreshed successfully, retrying API call...');
          
          // Update token in database
          await supabase
            .from('outlook_integration')
            .update({
              access_token_encrypted: refreshResult.access_token,
              refresh_token_encrypted: refreshResult.refresh_token || integration.refresh_token_encrypted,
              token_expires_at: new Date(Date.now() + (refreshResult.expires_in * 1000)).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
            
          // Retry with new token
          const newCleanToken = refreshResult.access_token.replace(/^Bearer\s+/i, '');
          const retryHeaders = {
            'Authorization': `Bearer ${newCleanToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };
          
          console.log('🔁 Retrying API call with refreshed token...');
          const retryResponse = await fetch(eventsUrl, {
            method: 'GET',
            headers: retryHeaders,
          });
          
          if (retryResponse.ok) {
            console.log('✅ Retry successful with refreshed token');
            const retryData = await retryResponse.json();
            const retryEvents: OutlookEvent[] = retryData.value || [];
            return await processImportedEvents(retryEvents, userId, supabase);
          } else {
            console.error('❌ Retry also failed:', retryResponse.status, retryResponse.statusText);
          }
        }
      }
      
      return 0;
    }

    const data = await response.json();
    const events: OutlookEvent[] = data.value || [];
    console.log(`📊 Found ${events.length} events in Outlook calendar`);
    
    return await processImportedEvents(events, userId, supabase);
  } catch (error) {
    console.error('💥 Import error:', error);
    return 0;
  }
}

async function processImportedEvents(events: OutlookEvent[], userId: string, supabase: any): Promise<number> {
  try {
    
    // Log first few events for debugging
    if (events.length > 0) {
      console.log('📝 Sample events:');
      events.slice(0, 3).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.subject} - ${event.start?.dateTime} to ${event.end?.dateTime}`);
      });
    } else {
      console.log('❌ NO EVENTS FOUND in Outlook calendar!');
      console.log('🔍 Possible reasons:');
      console.log('  1. No events exist in the date range');
      console.log('  2. Calendar permissions issue');
      console.log('  3. Wrong calendar being accessed');
      console.log('  4. Time zone issues');
    }

    let importedCount = 0;

    for (const event of events) {
      try {
        console.log(`🔍 Processing event: ${event.subject}`);
        
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('planning_events')
          .select('id')
          .eq('external_id', event.id)
          .eq('external_source', 'outlook')
          .maybeSingle();

        if (!existingEvent) {
          // Parse the event data
          const startDate = new Date(event.start.dateTime);
          const endDate = new Date(event.end.dateTime);
          
          console.log(`➕ Importing new event: ${event.subject}`);
          
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
            console.log(`✅ Imported: ${event.subject}`);
          } else {
            console.error(`❌ Failed to import event ${event.subject}:`, error.message);
          }
        } else {
          console.log(`⏭️ Event already exists: ${event.subject}`);
        }
      } catch (eventError) {
        console.error(`❌ Error processing individual event:`, eventError);
      }
    }

    console.log(`📥 Import complete: ${importedCount} new events imported`);
    return importedCount;
}

async function exportToOutlookCalendar(userId: string, accessToken: string, supabase: any): Promise<number> {
  try {
    console.log('🔍 Looking for unsynced events to export...');
    
    // First, let's get ALL planning events for this user to debug
    const { data: allEvents, error: allEventsError } = await supabase
      .from('planning_events')
      .select('*')
      .eq('user_id', userId);

    if (allEventsError) {
      console.error('❌ Error fetching all events:', allEventsError.message);
      return 0;
    }

    console.log(`🔍 Total events found for user: ${allEvents?.length || 0}`);
    
    if (allEvents && allEvents.length > 0) {
      console.log('📋 Event details:');
      allEvents.forEach((event, index) => {
        console.log(`  ${index + 1}. "${event.title}" - is_synced: ${event.is_synced}, external_source: ${event.external_source}, external_id: ${event.external_id}`);
      });
    }

    // Get unsynced events with explicit filtering
    const unsyncedEvents = allEvents?.filter((event: any) => {
      // An event needs to be synced if:
      // 1. is_synced is null, false, or undefined AND
      // 2. external_source is null or undefined (meaning it wasn't imported from external calendar)
      const isUnsynced = (event.is_synced === null || event.is_synced === false || event.is_synced === undefined);
      const isNotFromExternal = (event.external_source === null || event.external_source === undefined);
      
      const shouldSync = isUnsynced && isNotFromExternal;
      
      if (shouldSync) {
        console.log(`✅ Event "${event.title}" needs to be synced (is_synced: ${event.is_synced}, external_source: ${event.external_source})`);
      }
      
      return shouldSync;
    }) || [];

    if (unsyncedEvents.length === 0) {
      console.log('✅ No unsynced events found to export');
      return 0;
    }

    console.log(`📊 Found ${unsyncedEvents.length} unsynced events to export`);

    let exportedCount = 0;

    for (const event of unsyncedEvents) {
      try {
        console.log(`📤 Exporting event: ${event.title}`);
        
        // Create event in Outlook Calendar
        const startDateTime = new Date(`${event.date}T${event.time || '09:00'}:00`);
        const endDateTime = new Date(`${event.date}T${event.end_time || '10:00'}:00`);

      // Clean the access token
      const cleanToken = accessToken.replace(/^Bearer\s+/i, '');
      
      const outlookEventData = {
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

      console.log(`🌐 Creating event in Outlook: ${event.title}`, {
        outlookEventData,
        accessTokenPreview: `${cleanToken.substring(0, 20)}...`
      });
      
      const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(outlookEventData),
      });

        console.log('📥 Create event response:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          ok: createResponse.ok,
          eventTitle: event.title
        });

        if (createResponse.ok) {
          const createdEvent = await createResponse.json();
          console.log(`✅ Successfully created event in Outlook:`, {
            title: event.title,
            outlookId: createdEvent.id,
            originalEventId: event.id
          });
          
          // Update the event with Outlook ID and sync status
          const { error: updateError } = await supabase
            .from('planning_events')
            .update({
              external_id: createdEvent.id,
              external_source: 'outlook',
              is_synced: true
            })
            .eq('id', event.id);

          if (updateError) {
            console.error(`❌ Failed to update event sync status for ${event.title}:`, updateError.message);
          } else {
            console.log(`✅ Updated event sync status for: ${event.title}`);
          }

          exportedCount++;
        } else {
          const errorText = await createResponse.text();
          let errorJson;
          
          try {
            errorJson = JSON.parse(errorText);
            console.error(`❌ Failed to create event ${event.title} (parsed):`, {
              status: createResponse.status,
              statusText: createResponse.statusText,
              error: errorJson,
              errorCode: errorJson?.error?.code,
              errorMessage: errorJson?.error?.message
            });
          } catch (e) {
            console.error(`❌ Failed to create event ${event.title} (raw):`, {
              status: createResponse.status,
              statusText: createResponse.statusText,
              errorText: errorText
            });
          }
          
          if (createResponse.status === 401) {
            console.error('🔐 CREATE EVENT AUTHENTICATION FAILED - Token issues detected!');
          }
        }
      } catch (eventError) {
        console.error(`❌ Error exporting individual event ${event.title}:`, eventError);
      }
    }

    console.log(`📤 Export complete: ${exportedCount} events exported to Outlook`);
    return exportedCount;
  } catch (error) {
    console.error('💥 Export error:', error);
    return 0;
  }
}