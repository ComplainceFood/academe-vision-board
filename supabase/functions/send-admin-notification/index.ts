import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Shared email sender ──────────────────────────────────────────────────────
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
  console.log('Email sent, id:', result.id)
}

// ── Broadcast email template ─────────────────────────────────────────────────
function broadcastTemplate(title: string, content: string, author: string, priority: string) {
  const priorityBanner: Record<string, string> = {
    urgent:  'background:#dc2626;color:#fff;',
    high:    'background:#ea580c;color:#fff;',
    medium:  'background:#d97706;color:#fff;',
    normal:  'background:#2563eb;color:#fff;',
    low:     'background:#6b7280;color:#fff;',
  }
  const banner = priorityBanner[priority] || priorityBanner.normal

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D1E41 0%,#1B7A5A 100%);padding:28px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Smart-Prof</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Academic Management Platform</p>
        </td></tr>

        <!-- Priority banner -->
        <tr><td style="${banner}padding:8px 40px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
          📢 ${priority.toUpperCase()} - Platform Communication
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 8px;color:#0D1E41;font-size:20px;font-weight:700;">${title}</h2>
          <p style="margin:0 0 20px;color:#6b7280;font-size:13px;">From: <strong>${author}</strong></p>
          <div style="color:#4a5568;font-size:15px;line-height:1.7;">${content}</div>
          <div style="margin-top:28px;text-align:center;">
            <a href="https://smart-prof.us/communications" style="display:inline-block;background:linear-gradient(135deg,#1B7A5A,#3DAA6E);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
              View Communication →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            You received this because you have communications notifications enabled.<br/>
            <a href="https://smart-prof.us/settings" style="color:#1B7A5A;text-decoration:none;">Manage preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Invalid authorization')

    // Verify admin role
    const { data: userRole } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).single()
    if (!userRole || !['system_admin', 'primary_user'].includes(userRole.role)) {
      throw new Error('Insufficient permissions')
    }

    const { communicationId, title, content, priority = 'normal', targetUsers } = await req.json()

    // Get admin name
    const { data: adminProfile } = await supabase
      .from('profiles').select('display_name, first_name, last_name').eq('user_id', user.id).single()
    const authorName = adminProfile?.display_name ||
      `${adminProfile?.first_name || ''} ${adminProfile?.last_name || ''}`.trim() || 'Admin'

    // Resolve target users
    let usersToNotify: string[] = []
    if (targetUsers?.length > 0) {
      usersToNotify = targetUsers
    } else {
      const { data: allUsers } = await supabase
        .from('profiles').select('user_id').neq('user_id', user.id)
      usersToNotify = allUsers?.map((u: any) => u.user_id) || []
    }

    console.log(`Notifying ${usersToNotify.length} users for communication: ${communicationId}`)

    // Insert in-app notifications
    const notifications = usersToNotify.map(userId => ({
      user_id: userId,
      title: title || 'New Communication Published',
      content: content?.replace(/<[^>]*>/g, '').slice(0, 200) || 'A new communication has been published.',
      type: 'communication',
      priority,
      author: authorName,
      is_read: false,
      action_url: communicationId ? `/communications?highlight=${communicationId}` : '/communications',
      metadata: { communication_id: communicationId, sent_by: user.id, sent_at: new Date().toISOString() }
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('notifications').insert(notifications).select()
    if (insertError) throw insertError

    // Send emails to users who have email notifications enabled
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', usersToNotify)

    // Also check notification_preferences table
    const { data: prefRows } = await supabase
      .from('notification_preferences')
      .select('user_id, email_notifications')
      .in('user_id', usersToNotify)

    const prefMap = new Map((prefRows || []).map((p: any) => [p.user_id, p.email_notifications]))

    let emailsSent = 0
    const html = broadcastTemplate(title, content, authorName, priority)

    for (const profile of profiles || []) {
      // Skip if user explicitly disabled email notifications
      if (prefMap.has(profile.user_id) && prefMap.get(profile.user_id) === false) continue
      if (!profile.email) continue
      try {
        await sendEmail(profile.email, `${title} - Smart-Prof`, html)
        emailsSent++
      } catch (err) {
        console.error(`Failed to email ${profile.email}:`, err)
      }
    }

    console.log(`Done. In-app: ${inserted?.length || 0}, Emails: ${emailsSent}`)

    return new Response(
      JSON.stringify({ success: true, notifications_sent: inserted?.length || 0, emails_sent: emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('send-admin-notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
