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

    const { communicationId, title, content, priority = 'medium', targetUsers } = await req.json()
    
    // Get the user from the request (admin user)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    // Verify user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || (userRole.role !== 'system_admin' && userRole.role !== 'primary_user')) {
      throw new Error('Insufficient permissions')
    }

    console.log(`Sending admin notification for communication: ${communicationId}`)

    // Get admin profile for author name
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('display_name, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    const authorName = adminProfile?.display_name || 
                      `${adminProfile?.first_name || ''} ${adminProfile?.last_name || ''}`.trim() ||
                      'Admin'

    // Get target users (all users if not specified)
    let usersToNotify = []
    if (targetUsers && targetUsers.length > 0) {
      usersToNotify = targetUsers
    } else {
      // Get all active users
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .neq('user_id', user.id) // Exclude the admin who sent it

      usersToNotify = allUsers?.map(u => u.user_id) || []
    }

    console.log(`Notifying ${usersToNotify.length} users`)

    // Create notifications for each user
    const notifications = usersToNotify.map(userId => ({
      user_id: userId,
      title: title || 'New Communication Published',
      content: content || 'A new communication has been published by the admin.',
      type: 'communication' as const,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      author: authorName,
      is_read: false,
      action_url: communicationId ? `/communications?highlight=${communicationId}` : '/communications',
      metadata: {
        communication_id: communicationId,
        sent_by: user.id,
        sent_at: new Date().toISOString()
      }
    }))

    // Insert notifications
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (insertError) {
      console.error('Error inserting notifications:', insertError)
      throw insertError
    }

    // Send real-time notifications
    for (const notification of insertedNotifications || []) {
      await supabase
        .channel('notifications')
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: notification
        })
    }

    // Send external notifications (email) if enabled
    const emailsSent = await sendEmailNotifications(usersToNotify, title, content, authorName, supabase)

    console.log(`Admin notification sent successfully. Internal: ${insertedNotifications?.length || 0}, Email: ${emailsSent}`)

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: insertedNotifications?.length || 0,
        emails_sent: emailsSent,
        message: 'Admin notification sent successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Send admin notification error:', error)
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

async function sendEmailNotifications(userIds: string[], title: string, content: string, author: string, supabase: any): Promise<number> {
  try {
    // Get user emails and notification preferences
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        notification_preferences
      `)
      .in('user_id', userIds)

    if (error) {
      console.error('Error fetching user emails:', error)
      return 0
    }

    let emailsSent = 0

    for (const user of users || []) {
      // Check if user wants email notifications
      const preferences = user.notification_preferences || {}
      if (preferences.email_notifications === false) {
        continue
      }

      // Check communication notifications preference
      if (preferences.communication_alerts === false) {
        continue
      }

      try {
        // Send email notification
        const { error: emailError } = await supabase.functions.invoke('send-notification', {
          body: {
            to: user.email,
            subject: `${title} - SmartProf Platform`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Communication from ${author}</h2>
                <h3 style="color: #666;">${title}</h3>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  ${content}
                </div>
                <p style="color: #666; font-size: 14px;">
                  You received this email because you have communication notifications enabled. 
                  You can update your notification preferences in your account settings.
                </p>
                <p style="color: #999; font-size: 12px;">
                  SmartProf Platform - Academic Management System
                </p>
              </div>
            `
          }
        })

        if (!emailError) {
          emailsSent++
        }
      } catch (emailError) {
        console.error(`Error sending email to ${user.email}:`, emailError)
      }
    }

    return emailsSent
  } catch (error) {
    console.error('Error sending email notifications:', error)
    return 0
  }
}