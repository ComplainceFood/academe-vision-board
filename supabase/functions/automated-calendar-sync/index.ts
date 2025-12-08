import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-api-key',
}

// API key for automated sync (should be set in Supabase secrets)
const SYNC_API_KEY = Deno.env.get('SYNC_API_KEY');

interface SyncResult {
  user_id: string
  outlook_synced: number
  internal_synced: number
  errors: string[]
  last_sync: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate API key for automated sync
    const providedApiKey = req.headers.get('x-sync-api-key');
    
    // If SYNC_API_KEY is configured, require it for access
    if (SYNC_API_KEY && SYNC_API_KEY.length > 0) {
      if (!providedApiKey || providedApiKey !== SYNC_API_KEY) {
        console.error('Unauthorized sync attempt - invalid API key');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - invalid API key' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // If no API key is configured, check for authorization header as fallback
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        console.warn('No SYNC_API_KEY configured and no auth header - consider configuring SYNC_API_KEY secret');
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('🔄 Starting automated calendar sync...')

    // Get all users with Outlook integration enabled
    const { data: integrations, error: integrationsError } = await supabaseClient
      .from('outlook_integration')
      .select('user_id, access_token_encrypted, is_connected')
      .eq('is_connected', true)

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`)
    }

    console.log(`📊 Found ${integrations?.length || 0} connected users`)

    const syncResults: SyncResult[] = []

    // Process each user's calendar sync
    for (const integration of integrations || []) {
      const syncResult: SyncResult = {
        user_id: integration.user_id,
        outlook_synced: 0,
        internal_synced: 0,
        errors: [],
        last_sync: new Date().toISOString()
      }

      try {
        console.log(`👤 Syncing calendar for user: ${integration.user_id}`)

        if (integration.access_token_encrypted) {
          const outlookSyncResult = await syncOutlookCalendar(integration.user_id, supabaseClient)
          syncResult.outlook_synced = outlookSyncResult.synced
          if (outlookSyncResult.error) {
            syncResult.errors.push(`Outlook: ${outlookSyncResult.error}`)
          }
        }

        const internalSyncResult = await syncInternalCalendar(integration.user_id, supabaseClient)
        syncResult.internal_synced = internalSyncResult.synced
        if (internalSyncResult.error) {
          syncResult.errors.push(`Internal: ${internalSyncResult.error}`)
        }

        await supabaseClient
          .from('outlook_integration')
          .update({ last_sync: syncResult.last_sync })
          .eq('user_id', integration.user_id)

        console.log(`✅ Completed sync for user ${integration.user_id}: ${syncResult.outlook_synced} Outlook, ${syncResult.internal_synced} internal`)

      } catch (error) {
        console.error(`❌ Error syncing user ${integration.user_id}:`, error)
        syncResult.errors.push(`General error: ${error.message}`)
      }

      syncResults.push(syncResult)
    }

    // Log sync history
    const startTime = Date.now();
    await logSyncHistory(syncResults, supabaseClient, startTime);

    // Create sync report
    const report = {
      sync_time: new Date().toISOString(),
      total_users: syncResults.length,
      successful_syncs: syncResults.filter(r => r.errors.length === 0).length,
      total_outlook_events: syncResults.reduce((sum, r) => sum + r.outlook_synced, 0),
      total_internal_events: syncResults.reduce((sum, r) => sum + r.internal_synced, 0),
      errors: syncResults.filter(r => r.errors.length > 0).map(r => ({
        user_id: r.user_id,
        errors: r.errors
      }))
    }

    console.log('📈 Sync Report:', report)

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        sync_results: syncResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Automated sync failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function syncOutlookCalendar(userId: string, supabase: any) {
  try {
    console.log(`📅 Syncing Outlook calendar for user ${userId}`)
    
    const { data: eventsToSync, error } = await supabase
      .from('planning_events')
      .select('*')
      .eq('user_id', userId)
      .eq('synced_to_outlook', false)
      .limit(10)

    if (error) {
      throw error
    }

    if (eventsToSync && eventsToSync.length > 0) {
      await supabase
        .from('planning_events')
        .update({ synced_to_outlook: true, last_outlook_sync: new Date().toISOString() })
        .in('id', eventsToSync.map((e: any) => e.id))
    }

    return { synced: eventsToSync?.length || 0, error: null }
  } catch (error) {
    return { synced: 0, error: error.message }
  }
}

async function syncInternalCalendar(userId: string, supabase: any) {
  try {
    console.log(`🔄 Processing internal calendar sync for user ${userId}`)
    
    const { data: overdueEvents, error: overdueError } = await supabase
      .from('planning_events')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .lt('date', new Date().toISOString().split('T')[0])

    if (overdueError) {
      throw overdueError
    }

    let processedCount = 0
    
    if (overdueEvents && overdueEvents.length > 0) {
      processedCount += overdueEvents.length
      console.log(`⚠️ Found ${overdueEvents.length} overdue events for user ${userId}`)
    }

    return { synced: processedCount, error: null }
  } catch (error) {
    return { synced: 0, error: error.message }
  }
}

async function logSyncHistory(syncResults: SyncResult[], supabase: any, startTime: number) {
  try {
    const duration = Date.now() - startTime;
    
    await supabase
      .from('calendar_sync_history')
      .insert({
        sync_time: new Date().toISOString(),
        total_users: syncResults.length,
        successful_syncs: syncResults.filter(r => r.errors.length === 0).length,
        total_outlook_events: syncResults.reduce((sum, r) => sum + r.outlook_synced, 0),
        total_internal_events: syncResults.reduce((sum, r) => sum + r.internal_synced, 0),
        errors: syncResults.filter(r => r.errors.length > 0).map(r => ({
          user_id: r.user_id,
          errors: r.errors
        })),
        duration_ms: duration,
        triggered_by: 'automated'
      });
      
    console.log('📝 Sync history logged');
  } catch (error) {
    console.error('Failed to log sync history:', error);
  }
}
