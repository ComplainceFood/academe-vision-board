import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { accessToken, refreshToken } = await req.json()
    
    if (!accessToken) {
      throw new Error('Access token is required')
    }

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    console.log(`Starting Google Calendar sync for user: ${user.id}`)

    // Sync events from Google Calendar to our database
    const importedEvents = await importFromGoogleCalendar(user.id, accessToken, supabase)
    
    // Sync events from our database to Google Calendar
    const exportedEvents = await exportToGoogleCalendar(user.id, accessToken, supabase)

    // Update integration record
    const { error: integrationError } = await supabase
      .from('google_calendar_integration')
      .upsert({
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        last_sync: new Date().toISOString(),
        is_active: true
      })

    if (integrationError) {
      console.error('Error updating integration record:', integrationError)
    }

    const totalSynced = importedEvents.length + exportedEvents.length

    console.log(`Google Calendar sync completed for user ${user.id}. Total events synced: ${totalSynced}`)

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

  } catch (error) {
    console.error('Google Calendar sync error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
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

async function importFromGoogleCalendar(userId: string, accessToken: string, supabase: any) {
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
      throw new Error(`Google Calendar API error: ${calendarResponse.status}`)
    }

    const calendarData = await calendarResponse.json()
    const events = calendarData.items || []

    console.log(`Found ${events.length} events in Google Calendar`)

    const importedEvents = []

    for (const event of events) {
      if (!event.start || !event.start.dateTime) continue

      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('planning_events')
        .select('id')
        .eq('external_id', event.id)
        .eq('user_id', userId)
        .single()

      if (existingEvent) {
        console.log(`Event ${event.id} already exists, skipping`)
        continue
      }

      // Convert Google Calendar event to our format
      const planningEvent = {
        user_id: userId,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        start_date: new Date(event.start.dateTime).toISOString().split('T')[0],
        start_time: new Date(event.start.dateTime).toTimeString().slice(0, 5),
        end_time: event.end?.dateTime ? new Date(event.end.dateTime).toTimeString().slice(0, 5) : '',
        location: event.location || '',
        type: 'meeting' as const,
        priority: 'medium' as const,
        status: 'scheduled' as const,
        external_id: event.id,
        external_source: 'google_calendar' as const,
        is_synced: true
      }

      const { data, error } = await supabase
        .from('planning_events')
        .insert(planningEvent)
        .select()
        .single()

      if (error) {
        console.error(`Error importing event ${event.id}:`, error)
        continue
      }

      importedEvents.push(data)
      console.log(`Imported event: ${event.summary}`)
    }

    return importedEvents
  } catch (error) {
    console.error('Error importing from Google Calendar:', error)
    return []
  }
}

async function exportToGoogleCalendar(userId: string, accessToken: string, supabase: any) {
  try {
    // Get unsynced events from our database
    const { data: unsyncedEvents, error } = await supabase
      .from('planning_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_synced', false)
      .is('external_id', null)

    if (error) {
      console.error('Error fetching unsynced events:', error)
      return []
    }

    console.log(`Found ${unsyncedEvents?.length || 0} unsynced events to export`)

    const exportedEvents = []

    for (const event of unsyncedEvents || []) {
      try {
        // Create event in Google Calendar
        const startDateTime = `${event.start_date}T${event.start_time}:00`
        const endDateTime = event.end_time 
          ? `${event.start_date}T${event.end_time}:00`
          : `${event.start_date}T${event.start_time}:00`

        const googleEvent = {
          summary: event.title,
          description: event.description || '',
          location: event.location || '',
          start: {
            dateTime: startDateTime,
            timeZone: 'UTC'
          },
          end: {
            dateTime: endDateTime,
            timeZone: 'UTC'
          }
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
          console.error(`Failed to create event in Google Calendar: ${createResponse.status}`)
          continue
        }

        const createdEvent = await createResponse.json()

        // Update our database with the external ID
        const { error: updateError } = await supabase
          .from('planning_events')
          .update({
            external_id: createdEvent.id,
            external_source: 'google_calendar',
            is_synced: true
          })
          .eq('id', event.id)

        if (updateError) {
          console.error(`Error updating event ${event.id}:`, updateError)
          continue
        }

        exportedEvents.push(event)
        console.log(`Exported event to Google Calendar: ${event.title}`)

      } catch (eventError) {
        console.error(`Error exporting event ${event.id}:`, eventError)
        continue
      }
    }

    return exportedEvents
  } catch (error) {
    console.error('Error exporting to Google Calendar:', error)
    return []
  }
}