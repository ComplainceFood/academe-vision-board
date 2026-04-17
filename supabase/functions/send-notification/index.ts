import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'test' | 'welcome' | 'task_reminder' | 'meeting_alert' | 'low_supply' | 'funding_alert' | 'grant_deadline' | 'overdue_task';
  recipient: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// ── Shared layout wrapper ────────────────────────────────────────────────────
function layout(accentColor: string, iconEmoji: string, title: string, body: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D1E41 0%,#1B7A5A 100%);padding:28px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Smart-Prof</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Academic Management Platform</p></td>
            <td align="right" style="font-size:36px;">${iconEmoji}</td>
          </tr></table>
        </td></tr>

        <!-- Accent bar -->
        <tr><td style="background:${accentColor};height:4px;"></td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">${body}</td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 28px;text-align:center;">
          <a href="https://smart-prof.us" style="display:inline-block;background:linear-gradient(135deg,#1B7A5A,#3DAA6E);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
            Open Smart-Prof →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:18px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            You're receiving this because you have notifications enabled in Smart-Prof.<br/>
            <a href="https://smart-prof.us/settings" style="color:#1B7A5A;text-decoration:none;">Manage preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function infoBlock(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 12px;color:#6b7280;font-size:13px;white-space:nowrap;">${label}</td>
    <td style="padding:6px 12px;color:#111827;font-size:13px;font-weight:600;">${value}</td>
  </tr>`
}

// ── Typed templates ──────────────────────────────────────────────────────────

function welcomeTemplate(name: string) {
  const body = `
    <h2 style="margin:0 0 12px;color:#0D1E41;font-size:22px;font-weight:700;">Welcome to Smart-Prof, ${name}! 🎉</h2>
    <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">
      Your account is ready. Smart-Prof helps you manage your academic life — meetings, grants, publications, tasks, supplies, and more — all in one place.
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:24px;">
      <tr><td>
        <p style="margin:0 0 8px;font-weight:700;color:#065f46;font-size:14px;">🚀 Get started in 3 steps:</p>
        <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
          <li>Complete your profile in <strong>Settings</strong></li>
          <li>Schedule your first meeting or add a task</li>
          <li>Track your grants and publications</li>
        </ol>
      </td></tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      Questions? Reply to this email — we're happy to help.
    </p>`
  return layout('#3DAA6E', '🎓', 'Welcome to Smart-Prof', body)
}

function meetingAlertTemplate(title: string, message: string, data: Record<string, any>) {
  const body = `
    <h2 style="margin:0 0 16px;color:#0D1E41;font-size:20px;font-weight:700;">📅 Meeting Reminder</h2>
    <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">${message}</p>
    <table cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:8px;padding:4px 0;width:100%;margin-bottom:24px;">
      ${data.meeting_title ? infoBlock('Meeting', data.meeting_title) : ''}
      ${data.date ? infoBlock('Date', data.date) : ''}
      ${data.time ? infoBlock('Time', data.time) : ''}
      ${data.location ? infoBlock('Location', data.location) : ''}
      ${data.attendees ? infoBlock('Attendees', data.attendees) : ''}
    </table>
    ${data.agenda ? `<div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:4px;padding:14px 16px;">
      <p style="margin:0 0 6px;font-weight:700;font-size:13px;color:#1e40af;">Agenda</p>
      <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${data.agenda}</p>
    </div>` : ''}`
  return layout('#2563eb', '📅', title, body)
}

function taskReminderTemplate(title: string, message: string, data: Record<string, any>) {
  const isOverdue = data.is_overdue
  const accentColor = isOverdue ? '#dc2626' : '#d97706'
  const emoji = isOverdue ? '⚠️' : '⏰'
  const body = `
    <h2 style="margin:0 0 16px;color:#0D1E41;font-size:20px;font-weight:700;">${emoji} ${isOverdue ? 'Overdue Task' : 'Task Reminder'}</h2>
    <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">${message}</p>
    <table cellpadding="0" cellspacing="0" style="background:${isOverdue ? '#fef2f2' : '#fffbeb'};border-radius:8px;padding:4px 0;width:100%;margin-bottom:24px;">
      ${data.task_title ? infoBlock('Task', data.task_title) : ''}
      ${data.due_date ? infoBlock('Due', data.due_date) : ''}
      ${data.priority ? infoBlock('Priority', data.priority) : ''}
      ${data.category ? infoBlock('Category', data.category) : ''}
    </table>`
  return layout(accentColor, emoji, title, body)
}

function grantDeadlineTemplate(title: string, message: string, data: Record<string, any>) {
  const daysLeft = data.days_left ?? 0
  const urgentColor = daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#ea580c' : '#d97706'
  const body = `
    <h2 style="margin:0 0 16px;color:#0D1E41;font-size:20px;font-weight:700;">💰 Grant Deadline Alert</h2>
    <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">${message}</p>
    <table cellpadding="0" cellspacing="0" style="background:#fff7ed;border-radius:8px;padding:4px 0;width:100%;margin-bottom:24px;">
      ${data.grant_name ? infoBlock('Grant', data.grant_name) : ''}
      ${data.deadline ? infoBlock('Deadline', data.deadline) : ''}
      ${data.days_left !== undefined ? infoBlock('Days Remaining', `${data.days_left} day${data.days_left !== 1 ? 's' : ''}`) : ''}
      ${data.remaining_budget ? infoBlock('Remaining Budget', data.remaining_budget) : ''}
    </table>
    <div style="background:#fef2f2;border-left:4px solid ${urgentColor};border-radius:4px;padding:12px 16px;">
      <p style="margin:0;color:${urgentColor};font-size:13px;font-weight:600;">
        ⚡ Action required — ensure all expenditures are recorded before the deadline.
      </p>
    </div>`
  return layout(urgentColor, '💰', title, body)
}

function lowSupplyTemplate(title: string, message: string, data: Record<string, any>) {
  const body = `
    <h2 style="margin:0 0 16px;color:#0D1E41;font-size:20px;font-weight:700;">📦 Low Supply Alert</h2>
    <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">${message}</p>
    <table cellpadding="0" cellspacing="0" style="background:#fefce8;border-radius:8px;padding:4px 0;width:100%;margin-bottom:24px;">
      ${data.item_name ? infoBlock('Item', data.item_name) : ''}
      ${data.current_quantity !== undefined ? infoBlock('Current Stock', `${data.current_quantity} ${data.unit || 'units'}`) : ''}
      ${data.minimum_quantity !== undefined ? infoBlock('Minimum Level', `${data.minimum_quantity} ${data.unit || 'units'}`) : ''}
      ${data.category ? infoBlock('Category', data.category) : ''}
    </table>`
  return layout('#ca8a04', '📦', title, body)
}

function testTemplate(message: string) {
  const body = `
    <h2 style="margin:0 0 16px;color:#0D1E41;font-size:20px;font-weight:700;">✅ Test Notification</h2>
    <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">${message}</p>
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;padding:14px 16px;">
      <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;">
        ✓ Your email notifications are working correctly.
      </p>
    </div>`
  return layout('#16a34a', '✅', 'Test Notification', body)
}

function getTemplate(req: NotificationRequest): string {
  const data = req.data || {}
  switch (req.type) {
    case 'welcome':        return welcomeTemplate(data.name || 'there')
    case 'meeting_alert':  return meetingAlertTemplate(req.title, req.message, data)
    case 'task_reminder':  return taskReminderTemplate(req.title, req.message, data)
    case 'overdue_task':   return taskReminderTemplate(req.title, req.message, { ...data, is_overdue: true })
    case 'grant_deadline':
    case 'funding_alert':  return grantDeadlineTemplate(req.title, req.message, data)
    case 'low_supply':     return lowSupplyTemplate(req.title, req.message, data)
    case 'test':
    default:               return testTemplate(req.message)
  }
}

// ── Email sender ─────────────────────────────────────────────────────────────
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
  if (!res.ok) {
    console.error('Resend API error:', result)
    throw new Error(result.message || `Resend error ${res.status}`)
  }
  console.log('Email sent via Resend, id:', result.id)
}

// ── Handler ──────────────────────────────────────────────────────────────────
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

    const notificationData: NotificationRequest = await req.json()
    console.log('Processing notification type:', notificationData.type, 'for:', notificationData.recipient)

    const html = getTemplate(notificationData)
    await sendEmail(notificationData.recipient, notificationData.title, html)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', type: notificationData.type }),
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
