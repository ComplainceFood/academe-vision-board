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

    const { action, eventData, accessToken } = await req.json()

    if (!accessToken) {
      throw new Error('Microsoft Graph access token required')
    }

    const graphApiBase = 'https://graph.microsoft.com/v1.0'

    switch (action) {
      case 'sync_events': {
        console.log('Syncing events from Outlook calendar')
        
        // Get events from Outlook
        const outlookResponse = await fetch(`${graphApiBase}/me/calendar/events`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!outlookResponse.ok) {
          throw new Error(`Outlook API error: ${outlookResponse.statusText}`)
        }

        const outlookData = await outlookResponse.json()
        const outlookEvents = outlookData.value

        // Sync events to our database
        const syncedEvents = []
        for (const outlookEvent of outlookEvents) {
          // Check if event already exists
          const { data: existingEvent } = await supabaseClient
            .from('events')
            .select('*')
            .eq('user_id', user.id)
            .eq('outlook_id', outlookEvent.id)
            .single()

          const eventData = {
            user_id: user.id,
            title: outlookEvent.subject,
            start_date: outlookEvent.start.dateTime,
            end_date: outlookEvent.end.dateTime,
            description: outlookEvent.body?.content || '',
            location: outlookEvent.location?.displayName || '',
            outlook_id: outlookEvent.id,
            synced_from_outlook: true,
          }

          if (existingEvent) {
            // Update existing event
            const { data, error } = await supabaseClient
              .from('events')
              .update(eventData)
              .eq('id', existingEvent.id)
              .select()
              .single()

            if (error) throw error
            syncedEvents.push(data)
          } else {
            // Create new event
            const { data, error } = await supabaseClient
              .from('events')
              .insert(eventData)
              .select()
              .single()

            if (error) throw error
            syncedEvents.push(data)
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            syncedEvents: syncedEvents.length,
            events: syncedEvents 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_event': {
        console.log('Creating event in Outlook calendar')
        
        if (!eventData) {
          throw new Error('Event data is required')
        }

        const outlookEvent: OutlookEvent = {
          subject: eventData.title,
          start: {
            dateTime: eventData.start_date,
            timeZone: 'UTC'
          },
          end: {
            dateTime: eventData.end_date,
            timeZone: 'UTC'
          }
        }

        if (eventData.description) {
          outlookEvent.body = {
            content: eventData.description,
            contentType: 'text'
          }
        }

        if (eventData.location) {
          outlookEvent.location = {
            displayName: eventData.location
          }
        }

        const response = await fetch(`${graphApiBase}/me/calendar/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(outlookEvent)
        })

        if (!response.ok) {
          throw new Error(`Failed to create Outlook event: ${response.statusText}`)
        }

        const createdEvent = await response.json()

        // Update our local event with Outlook ID
        if (eventData.id) {
          await supabaseClient
            .from('events')
            .update({ 
              outlook_id: createdEvent.id,
              synced_to_outlook: true 
            })
            .eq('id', eventData.id)
        }

        return new Response(
          JSON.stringify({ success: true, outlookEvent: createdEvent }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_event': {
        console.log('Updating event in Outlook calendar')
        
        if (!eventData || !eventData.outlook_id) {
          throw new Error('Event data with Outlook ID is required')
        }

        const outlookEvent: OutlookEvent = {
          subject: eventData.title,
          start: {
            dateTime: eventData.start_date,
            timeZone: 'UTC'
          },
          end: {
            dateTime: eventData.end_date,
            timeZone: 'UTC'
          }
        }

        if (eventData.description) {
          outlookEvent.body = {
            content: eventData.description,
            contentType: 'text'
          }
        }

        if (eventData.location) {
          outlookEvent.location = {
            displayName: eventData.location
          }
        }

        const response = await fetch(`${graphApiBase}/me/calendar/events/${eventData.outlook_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(outlookEvent)
        })

        if (!response.ok) {
          throw new Error(`Failed to update Outlook event: ${response.statusText}`)
        }

        const updatedEvent = await response.json()

        return new Response(
          JSON.stringify({ success: true, outlookEvent: updatedEvent }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_event': {
        console.log('Deleting event from Outlook calendar')
        
        if (!eventData || !eventData.outlook_id) {
          throw new Error('Event data with Outlook ID is required')
        }

        const response = await fetch(`${graphApiBase}/me/calendar/events/${eventData.outlook_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })

        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to delete Outlook event: ${response.statusText}`)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Outlook sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})