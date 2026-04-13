import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Read key at request time so hot-reloads pick it up
function getGeminiKey() {
  return Deno.env.get('GEMINI_API_KEY') ?? '';
}

// Always return 200 so the Supabase JS client surfaces the body in `data` not `error`.
// Errors are communicated via { error: "..." } in the JSON body.
function ok(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let description = '';
  let today = '';
  let existing_events: { date: string; title: string }[] = [];

  try {
    const body = await req.json();
    description = (body.description ?? '').trim();
    today = body.today ?? new Date().toISOString().split('T')[0];
    existing_events = body.existing_events ?? [];
  } catch {
    return ok({ error: 'Invalid request body' });
  }

  if (!description) {
    return ok({ error: 'Description is required' });
  }

  const GEMINI_API_KEY = getGeminiKey();

  // No API key → graceful fallback (open the dialog pre-filled with the raw text)
  if (!GEMINI_API_KEY) {
    console.warn('ai-plan-event: GEMINI_API_KEY not set, using fallback');
    return ok(buildFallback(description, today));
  }

  try {
    const todayStr = today || new Date().toISOString().split('T')[0];

    const busyDates = existing_events
      .slice(0, 20)
      .map((e) => `${e.date}: ${e.title}`)
      .join('\n') || 'None';

    const prompt = `You are a calendar assistant for academic professionals. Parse the user input and return a JSON object.

User input: "${description}"
Today: ${todayStr}
Existing events: ${busyDates}

Return a JSON object with these exact keys:
- title: string (max 80 chars, clear event title)
- date: string (YYYY-MM-DD format, never in the past)
- time: string (HH:MM 24h format, or empty string for all-day)
- type: string (one of: task, deadline, event, meeting)
- priority: string (one of: low, medium, high, urgent)
- course: string (course code or topic, or empty string)
- description: string (1-2 sentences of context)
- conflict_warning: string (note if date clashes with existing events, or empty string)

Date rules (today = ${todayStr}):
- "tomorrow" = next day
- "this saturday" = upcoming Saturday
- "next [weekday]" = next occurrence of that weekday
- "this week" = nearest Friday
- "in X days" = calculate exactly
- No date mentioned = tomorrow

Type rules:
- task: grade, write, review, submit, do, prepare
- deadline: due date, submission deadline
- meeting: meeting, class, lecture, office hours, committee
- event: seminar, conference, appointment, ceremony

Priority rules:
- urgent: today or tomorrow, or explicitly urgent
- high: this week
- medium: this month
- low: beyond a month`;

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text().catch(() => '');
      console.error(`ai-plan-event: Gemini ${geminiRes.status}:`, errBody);
      // Fall back gracefully instead of failing
      return ok(buildFallback(description, todayStr));
    }

    const result = await geminiRes.json();
    const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip markdown code fences if Gemini wraps JSON in ```json ... ```
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('ai-plan-event: no JSON in response:', text);
      return ok(buildFallback(description, todayStr));
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Sanitize fields so the frontend never receives invalid values
    const validTypes = ['event', 'task', 'deadline', 'meeting'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    return ok({
      title: parsed.title || description.slice(0, 80),
      date: parsed.date || todayStr,
      time: parsed.time || '',
      type: validTypes.includes(parsed.type) ? parsed.type : 'task',
      priority: validPriorities.includes(parsed.priority) ? parsed.priority : 'medium',
      course: parsed.course || '',
      description: parsed.description || '',
      conflict_warning: parsed.conflict_warning || '',
    });

  } catch (err) {
    console.error('ai-plan-event: unexpected error:', err);
    // Return fallback so the dialog still opens - never block the user
    return ok(buildFallback(description, today));
  }
});

// ── Fallback parser - runs when GEMINI_API_KEY is missing or Gemini fails ────
// Parses common natural language date/time patterns so the dialog is
// pre-filled with sensible values instead of just "tomorrow".
function buildFallback(description: string, today: string): Record<string, string> {
  const text = description.trim();
  const lower = text.toLowerCase();
  const base = today ? new Date(`${today}T12:00:00`) : new Date();

  // ── Date parsing ──────────────────────────────────────────────────────────
  let date = new Date(base);
  date.setDate(date.getDate() + 1); // default: tomorrow

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  // "this sunday", "this monday", etc.
  const thisDayMatch = lower.match(/this\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  if (thisDayMatch) {
    const target = dayNames.indexOf(thisDayMatch[1]);
    const diff = (target - base.getDay() + 7) % 7 || 7;
    date = new Date(base);
    date.setDate(base.getDate() + diff);
  }

  // "next sunday", "next monday", etc.
  const nextDayMatch = lower.match(/next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  if (nextDayMatch) {
    const target = dayNames.indexOf(nextDayMatch[1]);
    const diff = (target - base.getDay() + 7) % 7 || 7;
    date = new Date(base);
    date.setDate(base.getDate() + diff);
  }

  // bare day name without "this/next": "saturday at 9am"
  const bareDayMatch = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (!thisDayMatch && !nextDayMatch && bareDayMatch) {
    const target = dayNames.indexOf(bareDayMatch[1]);
    const diff = (target - base.getDay() + 7) % 7 || 7;
    date = new Date(base);
    date.setDate(base.getDate() + diff);
  }

  // "tomorrow"
  if (lower.includes('tomorrow')) {
    date = new Date(base);
    date.setDate(base.getDate() + 1);
  }

  // "today"
  if (lower.includes('today')) {
    date = new Date(base);
  }

  // "in X days"
  const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    date = new Date(base);
    date.setDate(base.getDate() + parseInt(inDaysMatch[1]));
  }

  // "in X weeks"
  const inWeeksMatch = lower.match(/in\s+(\d+)\s+weeks?/);
  if (inWeeksMatch) {
    date = new Date(base);
    date.setDate(base.getDate() + parseInt(inWeeksMatch[1]) * 7);
  }

  // ── Time parsing ──────────────────────────────────────────────────────────
  let time = '';

  // "at 9 am", "at 9:30 am", "at 14:00", "at 9am"
  const timeMatch = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const mins = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // ── Type detection ────────────────────────────────────────────────────────
  let type = 'task';
  if (/meeting|class|lecture|office hours|committee|seminar|sync/i.test(text)) type = 'meeting';
  else if (/deadline|due|submit|submission/i.test(text)) type = 'deadline';
  else if (/conference|appointment|ceremony|event/i.test(text)) type = 'event';

  // ── Priority ──────────────────────────────────────────────────────────────
  let priority = 'medium';
  if (/urgent|asap|immediately|critical/i.test(text)) priority = 'urgent';
  else if (type === 'meeting' || /today|tomorrow/i.test(text)) priority = 'high';

  // ── Title ─────────────────────────────────────────────────────────────────
  // Capitalise first letter, strip trailing time/day phrases for cleanliness
  const title = text.charAt(0).toUpperCase() + text.slice(1);

  return {
    title: title.slice(0, 80),
    date: date.toISOString().split('T')[0],
    time,
    type,
    priority,
    course: '',
    description: text,
    conflict_warning: '',
  };
}
