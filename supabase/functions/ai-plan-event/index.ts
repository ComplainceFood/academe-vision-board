import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, today, existing_events } = await req.json();

    if (!description?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify(buildFallback(description, today)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const todayStr = today || new Date().toISOString().split('T')[0];

    // Summarize existing events to help AI avoid conflicts
    const busyDates = existing_events
      ?.slice(0, 20)
      .map((e: any) => `${e.date}: ${e.title}`)
      .join('\n') || 'None';

    const prompt = `You are a smart calendar assistant for academic professionals (professors, researchers, lecturers).

Parse the following natural language description and create a structured calendar event or task.

User input: "${description}"
Today's date: ${todayStr}
Upcoming busy dates:
${busyDates}

Respond ONLY with valid JSON in this exact format:
{
  "title": "Clear event/task title (max 80 chars)",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or empty string if all-day",
  "type": "event|task|deadline|reminder",
  "priority": "low|medium|high|urgent",
  "course": "Course code or topic (e.g. 'CS 101', 'Research', 'Committee Work') or empty string",
  "description": "2-3 sentence description with relevant context",
  "conflict_warning": "Warning if date conflicts with existing events, or empty string"
}

Date parsing rules (today = ${todayStr}):
- "tomorrow" → next day
- "next Monday/Friday/etc" → next occurrence of that weekday
- "this week" → nearest Friday
- "end of month" → last day of current month
- "next semester" → roughly 4 months from today
- "in X days/weeks" → calculate exactly
- If no date mentioned → use tomorrow
- Never use a date in the past

Type rules:
- "task" → action to complete (do, write, grade, review, submit)
- "deadline" → submission/due date
- "event" → meeting, class, seminar, conference, appointment
- "reminder" → follow-up, check-in, remember to

Priority rules:
- "urgent" → today or tomorrow, or explicitly urgent/ASAP
- "high" → this week
- "medium" → this month
- "low" → beyond a month or vague`;

    const response = await fetch(
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ai-plan-event error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to plan event' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildFallback(description: string, today: string) {
  const words = description.trim().split(/\s+/);
  const title = words.slice(0, 8).join(' ');
  const tomorrow = new Date(today || new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    date: tomorrow.toISOString().split('T')[0],
    time: '',
    type: 'task',
    priority: 'medium',
    course: '',
    description: description.trim(),
    conflict_warning: '',
  };
}
