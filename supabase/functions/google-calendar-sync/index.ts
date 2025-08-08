import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type SupabaseClient = ReturnType<typeof createClient>

type GoogleTokenRefreshResponse = {
  access_token: string
  expires_in?: number
  scope?: string
  token_type?: string
  refresh_token?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Read optional tokens from request body (we also support zero-body requests)
    let body: any = {}
    try {
      body = await req.json()
    } catch (_) {
      body = {}
    }

    const incomingAccessToken: string | undefined = body?.accessToken
    const incomingRefreshToken: string | undefined = body?.refreshToken

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    console.log(`[GCal] Starting sync for user: ${user.id}`)

    // Resolve tokens: prefer DB tokens; fall back to incoming tokens
    let accessToken = incomingAccessToken
    let refreshToken = incomingRefreshToken

    if (!accessToken || !refreshToken) {
      const { data: integrationRow, error: integrationFetchError } = await supabase
        .from('google_calendar_integration')
        .select('access_token, refresh_token, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (integrationFetchError) {
        console.warn('[GCal] Could not fetch stored tokens:', integrationFetchError)
      }

      accessToken = accessToken || integrationRow?.access_token || undefined
      refreshToken = refreshToken || integrationRow?.refresh_token || undefined
    }

    if (!accessToken && !refreshToken) {
      throw new Error('No Google tokens available. Please connect Google first.')
    }

    // Always attempt to refresh if we have a refresh token (more reliable UX)
    if (refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken)
      if (refreshed?.access_token) {
        console.log('[GCal] Obtained fresh access token via refresh_token')
        accessToken = refreshed.access_token
        if (refreshed.refresh_token) {
          // Google may rotate refresh_token
          refreshToken = refreshed.refresh_token
        }
      } else {
        console.warn('[GCal] Token refresh failed or not configured; using existing access token')
      }
    }

    if (!accessToken) {
      throw new Error('Unable to obtain a valid Google access token')
    }

    // Sync events from Google Calendar to our database
    const importedEvents = await importFromGoogleCalendar(user.id, accessToken, supabase)

    // Sync events from our database to Google Calendar
    const exportedEvents = await exportToGoogleCalendar(user.id, accessToken, supabase)

    // Update integration record with the latest tokens and sync timestamp
    const { error: integrationUpsertError } = await supabase
      .from('google_calendar_integration')
      .upsert({
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        last_sync: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      })

    if (integrationUpsertError) {
      console.error('[GCal] Error updating integration record:', integrationUpsertError)
    }

    const totalSynced = (importedEvents?.length || 0) + (exportedEvents?.length || 0)

    console.log(`[GCal] Sync completed for user ${user.id}. Imported: ${importedEvents.length}, Exported: ${exportedEvents.length}, Total: ${totalSynced}`)

    return new Response(
      JSON.stringify({
        success: true,
        synced: totalSynced,
        imported: importedEvents.length,
        exported: exportedEvents.length,
        message: 'Google Calendar sync completed successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error: any) {
    console.error('[GCal] Sync error:', error)
    return new Response(
      JSON.stringify({
        error: error?.message || 'Internal server error',
        success: false
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})

async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenRefreshResponse | null> {
  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.warn('[GCal] GOOGLE_CLIENT_ID/SECRET not set. Skipping token refresh.')
      return null
    }

    const params = new URLSearchParams()
    params.set('client_id', clientId)
    params.set('client_secret', clientSecret)
    params.set('refresh_token', refreshToken)
    params.set('grant_type', 'refresh_token')

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })

    if (!resp.ok) {
      console.error('[GCal] Refresh token request failed:', resp.status, await safeText(resp))
      return null
    }

    const json = await resp.json() as GoogleTokenRefreshResponse
    return json
  } catch (e) {
    console.error('[GCal] Error refreshing access token:', e)
    return null
  }
}

async function safeText(r: Response) {
  try { return await r.text() } catch { return '' }
}

async function importFromGoogleCalendar(userId: string, accessToken: string, supabase: SupabaseClient) {
  try {
    // Get events from Google Calendar
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!calendarResponse.ok) {
      console.error('[GCal] Google Calendar API error (import):', calendarResponse.status, await safeText(calendarResponse))
      return []
    }

    const calendarData = await calendarResponse.json()
    const events = calendarData.items || []

    console.log(`[GCal] Import: Found ${events.length} Google events`)

    const importedEvents: any[] = []

    for (const event of events) {
      if (!event.start || (!event.start.dateTime && !event.start.date)) continue

      // Normalize start/end to dateTime if all-day
      const startIso = event.start.dateTime ? new Date(event.start.dateTime).toISOString() : `${event.start.date}T00:00:00.000Z`
      const endIso = event.end?.dateTime ? new Date(event.end.dateTime).toISOString() : (event.end?.date ? `${event.end.date}T23:59:00.000Z` : startIso)

      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('planning_events')
        .select('id')
        .eq('external_id', event.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingEvent) {
        continue
      }

      // Convert Google Calendar event to our format - align with database schema
      const planningEvent = {
        user_id: userId,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        date: new Date(startIso).toISOString().split('T')[0],  // Use 'date' not 'start_date'
        time: new Date(startIso).toTimeString().slice(0, 5),   // Use 'time' not 'start_time'
        end_time: endIso ? new Date(endIso).toTimeString().slice(0, 5) : '',
        location: event.location || '',
        type: 'meeting' as const,
        priority: 'medium' as const,
        external_id: event.id,
        external_source: 'google_calendar' as const,
        is_synced: true
      }

      const { data, error } = await (supabase as any)
        .from('planning_events')
        .insert(planningEvent)
        .select()
        .maybeSingle()

      if (error) {
        console.error(`[GCal] Error importing event ${event.id}:`, error)
        continue
      }

      if (data) importedEvents.push(data)
    }

    return importedEvents
  } catch (error) {
    console.error('[GCal] Error importing from Google Calendar:', error)
    return []
  }
}

async function exportToGoogleCalendar(userId: string, accessToken: string, supabase: SupabaseClient) {
  try {
    // Get unsynced events from our database
    const { data: unsyncedEvents, error } = await (supabase as any)
      .from('planning_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_synced', false)
      .is('external_id', null)

    if (error) {
      console.error('[GCal] Error fetching unsynced events:', error)
      return []
    }

    console.log(`[GCal] Export: Found ${unsyncedEvents?.length || 0} unsynced events`)

    const exportedEvents: any[] = []

    for (const event of unsyncedEvents || []) {
      try {
        // Create event in Google Calendar - use correct field names
        const startDateTime = `${event.date}T${event.time || '00:00'}:00`
        const endDateTime = event.end_time
          ? `${event.date}T${event.end_time}:00`
          : `${event.date}T${event.time || '00:00'}:00`

        const googleEvent = {
          summary: event.title,
          description: event.description || '',
          location: event.location || '',
          start: { dateTime: startDateTime, timeZone: 'UTC' },
          end: { dateTime: endDateTime, timeZone: 'UTC' },
        }

        const createResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent)
          }
        )

        if (!createResponse.ok) {
          console.error('[GCal] Failed to create Google event:', createResponse.status, await safeText(createResponse))
          continue
        }

        const createdEvent = await createResponse.json()

        // Update our database with the external ID
        const { error: updateError } = await (supabase as any)
          .from('planning_events')
          .update({
            external_id: createdEvent.id,
            external_source: 'google_calendar',
            is_synced: true
          })
          .eq('id', event.id)

        if (updateError) {
          console.error(`[GCal] Error updating event ${event.id}:`, updateError)
          continue
        }

        exportedEvents.push(event)
      } catch (eventError) {
        console.error(`[GCal] Error exporting event ${event.id}:`, eventError)
        continue
      }
    }

    return exportedEvents
  } catch (error) {
    console.error('[GCal] Error exporting to Google Calendar:', error)
    return []
  }
}
