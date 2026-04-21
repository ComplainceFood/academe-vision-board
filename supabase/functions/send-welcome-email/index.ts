import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY secret is not set')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Smart-Prof <notifications@smart-prof.us>',
      to: [to],
      reply_to: 'noicereader@gmail.com',
      subject,
      html,
    }),
  })
  const result = await res.json()
  if (!res.ok) throw new Error(result.message || `Resend error ${res.status}`)
  console.log('Welcome email sent, id:', result.id)
}

function welcomeTemplate(name: string, email: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Welcome to Smart-Prof</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D1E41 0%,#1B7A5A 100%);padding:36px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">🎓</div>
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">Welcome to Smart-Prof!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your academic management platform</p>
        </td></tr>

        <!-- Green accent bar -->
        <tr><td style="background:#3DAA6E;height:4px;"></td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#0D1E41;font-size:18px;font-weight:700;">Hi ${name},</p>
          <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">
            Your Smart-Prof account is ready. You now have everything you need to manage your academic work efficiently - from meetings and grants to publications and supplies.
          </p>

          <!-- Feature highlights -->
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
            <tr>
              <td style="padding:0 8px 12px 0;width:50%;vertical-align:top;">
                <div style="background:#f0fdf4;border-radius:8px;padding:16px;">
                  <div style="font-size:22px;margin-bottom:6px;">📅</div>
                  <p style="margin:0 0 4px;font-weight:700;color:#065f46;font-size:13px;">Meetings & 1:1s</p>
                  <p style="margin:0;color:#374151;font-size:12px;line-height:1.5;">Schedule and manage all your academic meetings</p>
                </div>
              </td>
              <td style="padding:0 0 12px 8px;width:50%;vertical-align:top;">
                <div style="background:#eff6ff;border-radius:8px;padding:16px;">
                  <div style="font-size:22px;margin-bottom:6px;">💰</div>
                  <p style="margin:0 0 4px;font-weight:700;color:#1e40af;font-size:13px;">Grant Management</p>
                  <p style="margin:0;color:#374151;font-size:12px;line-height:1.5;">Track funding sources and expenditures</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 8px 0 0;width:50%;vertical-align:top;">
                <div style="background:#fdf4ff;border-radius:8px;padding:16px;">
                  <div style="font-size:22px;margin-bottom:6px;">🏆</div>
                  <p style="margin:0 0 4px;font-weight:700;color:#7e22ce;font-size:13px;">Achievements</p>
                  <p style="margin:0;color:#374151;font-size:12px;line-height:1.5;">Log publications, awards & presentations</p>
                </div>
              </td>
              <td style="padding:0 0 0 8px;width:50%;vertical-align:top;">
                <div style="background:#fff7ed;border-radius:8px;padding:16px;">
                  <div style="font-size:22px;margin-bottom:6px;">📊</div>
                  <p style="margin:0 0 4px;font-weight:700;color:#c2410c;font-size:13px;">Analytics</p>
                  <p style="margin:0;color:#374151;font-size:12px;line-height:1.5;">AI-powered insights across all your data</p>
                </div>
              </td>
            </tr>
          </table>

          <!-- Get started steps -->
          <div style="background:#f8fafc;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 12px;font-weight:700;color:#0D1E41;font-size:14px;">🚀 Get started in 3 steps:</p>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;line-height:1.6;">
                <span style="display:inline-block;background:#1B7A5A;color:#fff;border-radius:50%;width:20px;height:20px;text-align:center;font-size:11px;font-weight:700;line-height:20px;margin-right:10px;">1</span>
                Complete your profile in <strong>Settings</strong>
              </td></tr>
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;line-height:1.6;">
                <span style="display:inline-block;background:#1B7A5A;color:#fff;border-radius:50%;width:20px;height:20px;text-align:center;font-size:11px;font-weight:700;line-height:20px;margin-right:10px;">2</span>
                Schedule your first meeting or add a task
              </td></tr>
              <tr><td style="padding:4px 0;color:#374151;font-size:14px;line-height:1.6;">
                <span style="display:inline-block;background:#1B7A5A;color:#fff;border-radius:50%;width:20px;height:20px;text-align:center;font-size:11px;font-weight:700;line-height:20px;margin-right:10px;">3</span>
                Add your grants and track expenditures
              </td></tr>
            </table>
          </div>

          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
            Signed up with: <strong>${email}</strong><br/>
            Questions? Simply reply to this email - we're happy to help.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <a href="https://smart-prof.us" style="display:inline-block;background:linear-gradient(135deg,#1B7A5A,#3DAA6E);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
            Start Using Smart-Prof →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            Smart-Prof - Academic Management Platform<br/>
            <a href="https://smart-prof.us/settings" style="color:#1B7A5A;text-decoration:none;">Manage notification preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

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

    const { name, email } = await req.json()
    const recipientEmail = email || user.email
    const recipientName = name || recipientEmail?.split('@')[0] || 'there'

    if (!recipientEmail) throw new Error('No recipient email')

    await sendEmail(
      recipientEmail,
      'Welcome to Smart-Prof 🎓',
      welcomeTemplate(recipientName, recipientEmail)
    )

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Welcome email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
