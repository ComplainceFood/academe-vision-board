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

const emailTemplate = (title: string, message: string, type: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0D1E41 0%,#1B7A5A 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Smart-Prof</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Academic Management Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 16px;color:#0D1E41;font-size:20px;font-weight:700;">${title}</h2>
              <p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:1.7;">${message}</p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f8fafc;border-left:4px solid #1B7A5A;border-radius:4px;padding:14px 16px;">
                    <p style="margin:0;color:#6b7280;font-size:13px;">
                      <strong style="color:#374151;">Notification type:</strong> ${type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                  </td>
                </tr>
              </table>

              <div style="margin-top:28px;text-align:center;">
                <a href="https://smart-prof.us" style="display:inline-block;background:linear-gradient(135deg,#1B7A5A,#3DAA6E);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                  Open Smart-Prof →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because you have notifications enabled in Smart-Prof.<br/>
                <a href="https://smart-prof.us/settings" style="color:#1B7A5A;text-decoration:none;">Manage notification preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY secret is not set')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Smart-Prof <notifications@smart-prof.us>',
      to: [to],
      subject,
      html,
      reply_to: 'noicereader@gmail.com',
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    console.error('Resend API error:', result)
    throw new Error(result.message || `Resend API error: ${response.status}`)
  }

  console.log('Email sent via Resend, id:', result.id)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) throw new Error('Invalid user token')

    const notificationData: NotificationRequest = await req.json()
    console.log('Processing notification:', notificationData.type, 'for', notificationData.recipient)

    const html = emailTemplate(notificationData.title, notificationData.message, notificationData.type)
    await sendEmail(notificationData.recipient, notificationData.title, html)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        type: notificationData.type,
        recipient: notificationData.recipient,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
