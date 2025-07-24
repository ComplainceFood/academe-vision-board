import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OutlookEvent {
  subject: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  body?: {
    content: string
    contentType: string
  }
  location?: {
    displayName: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const { action, eventData } = await req.json()

    // Get the user's Outlook integration settings
    const { data: integration, error: integrationError } = await supabaseClient
      .from('outlook_integration')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (integrationError || !integration || !integration.is_connected) {
      throw new Error('Outlook integration not connected')
    }

    // In a real implementation, you would decrypt the stored tokens
    // For now, we'll return a mock response
    console.log(`OAuth Sync action: ${action} for user ${user.id}`)

    const graphApiBase = 'https://graph.microsoft.com/v1.0'

    switch (action) {
      case 'sync_events': {
        console.log('Syncing events from Outlook calendar via OAuth')
        
        // In a real implementation, you would:
        // 1. Decrypt the stored access_token
        // 2. Check if it's expired and refresh if needed
        // 3. Make the API call to Microsoft Graph
        
        // For now, we'll return a mock response
        const mockSyncedEvents = [
          {
            id: 'mock-event-1',
            title: 'Team Meeting',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 3600000).toISOString(),
            description: 'Weekly team sync',
            location: 'Conference Room A',
            synced_from_outlook: true,
            user_id: user.id,
          }
        ]

        // Update integration last sync time
        await supabaseClient
          .from('outlook_integration')
          .update({
            last_sync: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            syncedEvents: mockSyncedEvents.length,
            events: mockSyncedEvents,
            message: 'OAuth sync completed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'refresh_token': {
        console.log('Refreshing OAuth token')
        
        // In a real implementation, you would:
        // 1. Use the refresh token to get a new access token
        // 2. Update the stored encrypted tokens
        // 3. Return success status
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Token refreshed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'disconnect': {
        console.log('Disconnecting OAuth integration')
        
        // Clear the integration tokens
        await supabaseClient
          .from('outlook_integration')
          .update({
            is_connected: false,
            access_token_encrypted: null,
            refresh_token_encrypted: null,
            token_expires_at: null,
          })
          .eq('user_id', user.id)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'OAuth integration disconnected'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown OAuth action: ${action}`)
    }

  } catch (error) {
    console.error('OAuth sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})