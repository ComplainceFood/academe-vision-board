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
}

function layout(accentColor: string, icon: string, title: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#0D1E41 0%,#1B7A5A 100%);padding:24px 36px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Smart-Prof</h1></td>
    <td align="right" style="font-size:32px;">${icon}</td>
  </tr></table>
</td></tr>
<tr><td style="background:${accentColor};height:4px;"></td></tr>
<tr><td style="padding:28px 36px;">${body}</td></tr>
<tr><td style="padding:0 36px 24px;text-align:center;">
  <a href="https://smart-prof.us" style="display:inline-block;background:linear-gradient(135deg,#1B7A5A,#3DAA6E);color:#fff;text-decoration:none;padding:11px 28px;border-radius:8px;font-size:14px;font-weight:600;">Open Smart-Prof →</a>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e5e7eb;text-align:center;">
  <p style="margin:0;color:#9ca3af;font-size:11px;">
    Smart-Prof notifications · <a href="https://smart-prof.us/settings" style="color:#1B7A5A;text-decoration:none;">Manage preferences</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:5px 12px;color:#6b7280;font-size:13px;white-space:nowrap;width:130px;">${label}</td>
    <td style="padding:5px 12px;color:#111827;font-size:13px;font-weight:600;">${value}</td>
  </tr>`
}

// ── Meeting reminder template ─────────────────────────────────────────────
function meetingEmail(m: any) {
  const body = `
    <h2 style="margin:0 0 8px;color:#0D1E41;font-size:19px;font-weight:700;">📅 Meeting in 30 minutes</h2>
    <p style="margin:0 0 18px;color:#4a5568;font-size:14px;line-height:1.6;">Your meeting is starting soon. Here are the details:</p>
    <table cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:8px;padding:4px 0;width:100%;margin-bottom:20px;">
      ${row('Meeting', m.title)}
      ${row('Date', new Date(m.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))}
      ${row('Time', `${m.start_time} – ${m.end_time}`)}
      ${m.location ? row('Location', m.location) : ''}
      ${m.attendees?.length ? row('Attendees', `${m.attendees.length} participant${m.attendees.length !== 1 ? 's' : ''}`) : ''}
    </table>
    ${m.agenda ? `<div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:4px;padding:12px 14px;">
      <p style="margin:0 0 4px;font-weight:700;font-size:12px;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">Agenda</p>
      <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${m.agenda}</p>
    </div>` : ''}`
  return layout('#2563eb', '📅', `Meeting Reminder: ${m.title}`, body)
}

// ── Overdue task template ─────────────────────────────────────────────────
function overdueEmail(tasks: any[]) {
  const taskRows = tasks.slice(0, 5).map(t => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${t.title}</p>
        ${t.due_date ? `<p style="margin:2px 0 0;font-size:12px;color:#dc2626;">Due: ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;text-align:right;">
        <span style="background:#fee2e2;color:#dc2626;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;">OVERDUE</span>
      </td>
    </tr>`).join('')

  const body = `
    <h2 style="margin:0 0 8px;color:#0D1E41;font-size:19px;font-weight:700;">⚠️ You have ${tasks.length} overdue task${tasks.length !== 1 ? 's' : ''}</h2>
    <p style="margin:0 0 18px;color:#4a5568;font-size:14px;line-height:1.6;">These tasks are past their due date. Please review and update them in Smart-Prof.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #fee2e2;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#fef2f2;">
        <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px;">Task</td>
        <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#dc2626;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
      </tr>
      ${taskRows}
    </table>
    ${tasks.length > 5 ? `<p style="margin:0;color:#6b7280;font-size:13px;">+ ${tasks.length - 5} more overdue tasks</p>` : ''}`
  return layout('#dc2626', '⚠️', `${tasks.length} Overdue Tasks`, body)
}

// ── Grant deadline template ───────────────────────────────────────────────
function grantDeadlineEmail(grants: any[]) {
  const grantRows = grants.map(g => {
    const days = Math.ceil((new Date(g.end_date).getTime() - Date.now()) / 86400000)
    const urgentColor = days <= 3 ? '#dc2626' : days <= 7 ? '#ea580c' : '#d97706'
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #fde68a;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${g.name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Remaining: ${fmt.format(g.remaining_amount)}</p>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #fde68a;text-align:right;white-space:nowrap;">
        <span style="background:#fef3c7;color:${urgentColor};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;">${days}d left</span>
      </td>
    </tr>`
  }).join('')

  const body = `
    <h2 style="margin:0 0 8px;color:#0D1E41;font-size:19px;font-weight:700;">💰 Grant Deadlines Approaching</h2>
    <p style="margin:0 0 18px;color:#4a5568;font-size:14px;line-height:1.6;">${grants.length} grant${grants.length !== 1 ? 's are' : ' is'} expiring within 14 days. Ensure all spending is recorded.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #fde68a;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#fffbeb;">
        <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Grant</td>
        <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#92400e;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Deadline</td>
      </tr>
      ${grantRows}
    </table>`
  return layout('#d97706', '💰', 'Grant Deadlines Approaching', body)
}

// ── Low supply template ───────────────────────────────────────────────────
function lowSupplyEmail(items: any[]) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #fde68a;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${i.name}</p>
        ${i.category ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${i.category}</p>` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #fde68a;text-align:right;">
        <span style="background:#fef9c3;color:#a16207;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;">
          ${i.quantity} ${i.unit || 'units'} left
        </span>
      </td>
    </tr>`).join('')

  const body = `
    <h2 style="margin:0 0 8px;color:#0D1E41;font-size:19px;font-weight:700;">📦 Low Supply Alert</h2>
    <p style="margin:0 0 18px;color:#4a5568;font-size:14px;line-height:1.6;">${items.length} item${items.length !== 1 ? 's are' : ' is'} running low on stock. Consider reordering soon.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #fde68a;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#fefce8;">
        <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#854d0e;text-transform:uppercase;letter-spacing:0.5px;">Item</td>
        <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#854d0e;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Stock</td>
      </tr>
      ${itemRows}
    </table>`
  return layout('#ca8a04', '📦', 'Low Supply Alert', body)
}

// ── Main handler ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // ── Get all users with their emails and notification prefs ──────────────
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')

    if (!profiles?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No users found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: prefRows } = await supabase
      .from('notification_preferences')
      .select('user_id, email_notifications, meeting_alerts, task_reminders, low_supply_alerts, funding_alerts')

    const prefMap = new Map((prefRows || []).map((p: any) => [p.user_id, p]))

    const stats = { meetings: 0, overdue: 0, grants: 0, supplies: 0 }

    for (const profile of profiles) {
      if (!profile.email) continue
      const prefs = prefMap.get(profile.user_id) || {}
      const emailEnabled = prefs.email_notifications !== false

      if (!emailEnabled) continue

      // ── 1. Meeting reminders (meetings starting in next 60 min) ───────────
      if (prefs.meeting_alerts !== false) {
        const in60min = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
        const in30min = new Date(now.getTime() + 30 * 60 * 1000).toISOString()

        const { data: meetings } = await supabase
          .from('meetings')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('status', 'scheduled')
          .eq('start_date', todayStr)

        const upcoming = (meetings || []).filter(m => {
          const meetingTime = new Date(`${m.start_date}T${m.start_time}`)
          return meetingTime >= new Date(in30min) && meetingTime <= new Date(in60min)
        })

        for (const meeting of upcoming) {
          try {
            await sendEmail(
              profile.email,
              `Reminder: "${meeting.title}" starts in 30 minutes`,
              meetingEmail(meeting)
            )
            stats.meetings++
          } catch (e) { console.error('Meeting email error:', e) }
        }
      }

      // ── 2. Overdue tasks (daily digest) ───────────────────────────────────
      if (prefs.task_reminders !== false) {
        const { data: tasks } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('type', 'task')
          .neq('status', 'completed')
          .lt('due_date', todayStr)
          .not('due_date', 'is', null)

        if (tasks?.length) {
          try {
            await sendEmail(
              profile.email,
              `⚠️ You have ${tasks.length} overdue task${tasks.length !== 1 ? 's' : ''} - Smart-Prof`,
              overdueEmail(tasks)
            )
            stats.overdue++
          } catch (e) { console.error('Overdue tasks email error:', e) }
        }
      }

      // ── 3. Grant deadlines (within 14 days) ───────────────────────────────
      if (prefs.funding_alerts !== false) {
        const in14days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const { data: grants } = await supabase
          .from('funding_sources')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('status', 'active')
          .not('end_date', 'is', null)
          .lte('end_date', in14days)
          .gte('end_date', todayStr)

        if (grants?.length) {
          try {
            await sendEmail(
              profile.email,
              `💰 ${grants.length} grant deadline${grants.length !== 1 ? 's' : ''} within 14 days - Smart-Prof`,
              grantDeadlineEmail(grants)
            )
            stats.grants++
          } catch (e) { console.error('Grant deadline email error:', e) }
        }
      }

      // ── 4. Low supply alerts ──────────────────────────────────────────────
      if (prefs.low_supply_alerts !== false) {
        // Fetch all supplies then filter client-side since PostgREST can't compare two columns
        const { data: allSupplies } = await supabase
          .from('supplies')
          .select('*')
          .eq('user_id', profile.user_id)
          .gt('threshold', 0)
        const supplies = (allSupplies || []).filter((s: any) => s.current_count <= s.threshold)

        if (supplies?.length) {
          try {
            await sendEmail(
              profile.email,
              `📦 ${supplies.length} supply item${supplies.length !== 1 ? 's are' : ' is'} low on stock - Smart-Prof`,
              lowSupplyEmail(supplies)
            )
            stats.supplies++
          } catch (e) { console.error('Low supply email error:', e) }
        }
      }
    }

    console.log('Automated reminders sent:', stats)

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Automated reminders error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
