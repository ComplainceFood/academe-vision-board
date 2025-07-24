import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'test' | 'task_reminder' | 'meeting_alert' | 'low_supply' | 'funding_alert';
  recipient: string;
  title: string;
  message: string;
  data?: any;
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

    const notificationData: NotificationRequest = await req.json()

    console.log('Sending notification:', notificationData)

    // For now, we'll simulate email sending since we don't have SMTP configured
    // In production, you would integrate with a service like SendGrid, Mailgun, etc.
    
    switch (notificationData.type) {
      case 'test':
        console.log(`📧 Test Email to ${notificationData.recipient}:`)
        console.log(`Subject: ${notificationData.title}`)
        console.log(`Body: ${notificationData.message}`)
        break
        
      case 'task_reminder':
        console.log(`⏰ Task Reminder to ${notificationData.recipient}:`)
        console.log(`Subject: ${notificationData.title}`)
        console.log(`Body: ${notificationData.message}`)
        break
        
      case 'meeting_alert':
        console.log(`👥 Meeting Alert to ${notificationData.recipient}:`)
        console.log(`Subject: ${notificationData.title}`)
        console.log(`Body: ${notificationData.message}`)
        break
        
      case 'low_supply':
        console.log(`📦 Low Supply Alert to ${notificationData.recipient}:`)
        console.log(`Subject: ${notificationData.title}`)
        console.log(`Body: ${notificationData.message}`)
        break
        
      case 'funding_alert':
        console.log(`💰 Funding Alert to ${notificationData.recipient}:`)
        console.log(`Subject: ${notificationData.title}`)
        console.log(`Body: ${notificationData.message}`)
        break
        
      default:
        throw new Error(`Unknown notification type: ${notificationData.type}`)
    }

    // Here you would integrate with your email service
    // Example with a hypothetical email service:
    /*
    const emailService = {
      to: notificationData.recipient,
      subject: notificationData.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${notificationData.title}</h2>
          <p style="color: #666; line-height: 1.5;">${notificationData.message}</p>
          <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              This email was sent from Academia Vision. 
              You can manage your notification preferences in your account settings.
            </p>
          </div>
        </div>
      `
    }

    const response = await fetch('https://api.emailservice.com/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('EMAIL_SERVICE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailService)
    })

    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`)
    }
    */

    // For now, we'll just log and return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        type: notificationData.type,
        recipient: notificationData.recipient 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})