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
            responseMimeType: "application/json",
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
