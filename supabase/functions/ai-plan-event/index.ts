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

    const prompt = `You are a smart calendar assistant for academic professionals (professors, researchers, lecturers).

Parse the following natural language description and create a structured calendar event or task.

User input: "${description}"
Today's date: ${todayStr}
Upcoming busy dates:
${busyDates}

Respond ONLY with valid JSON (no markdown, no code fences) in this exact format:
{
  "title": "Clear event/task title (max 80 chars)",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or empty string if all-day",
  "type": "event|task|deadline|meeting",
  "priority": "low|medium|high|urgent",
  "course": "Course code or topic (e.g. 'CS 101', 'Research', 'Committee Work') or empty string",
  "description": "2-3 sentence description with relevant context",
  "conflict_warning": "Warning if date conflicts with existing events, or empty string"
}

Date parsing rules (today = ${todayStr}):
- "tomorrow" → next day
- "next Monday/Friday/etc" → next occurrence of that weekday
- "this week" → nearest Friday
- "this saturday/sunday" → the upcoming Saturday/Sunday
- "end of month" → last day of current month
- "next semester" → roughly 4 months from today
- "in X days/weeks" → calculate exactly
- If no date mentioned → use tomorrow
- Never use a date in the past

Type rules:
- "task" → action to complete (do, write, grade, review, submit, remember to)
- "deadline" → submission/due date
- "event" → seminar, conference, appointment, ceremony
- "meeting" → meeting, class, lecture, office hours, committee, sync

Priority rules:
- "urgent" → today or tomorrow, or explicitly urgent/ASAP
- "high" → this week
- "medium" → this month
- "low" → beyond a month or vague`;

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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
    // Return fallback so the dialog still opens — never block the user
    return ok(buildFallback(description, today));
  }
});

function buildFallback(description: string, today: string): Record<string, string> {
  const words = description.trim().split(/\s+/);
  const title = words.slice(0, 8).join(' ');
  const d = new Date(today || new Date());
  d.setDate(d.getDate() + 1);
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    date: d.toISOString().split('T')[0],
    time: '',
    type: 'task',
    priority: 'medium',
    course: '',
    description: description.trim(),
    conflict_warning: '',
  };
}
