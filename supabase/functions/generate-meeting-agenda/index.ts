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
    const { title, type, attendees, purpose, date } = await req.json();

    if (!title?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Meeting title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify(buildFallback(title, type)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const meetingType = type === 'one_on_one' || type === '1:1' ? '1-on-1' : 'group';
    const attendeeList = Array.isArray(attendees)
      ? attendees.map((a: any) => a.name || a).join(', ')
      : attendees || 'Not specified';

    const prompt = `You are an assistant helping academic professionals run effective meetings.

Generate a structured, time-boxed meeting agenda for the following:

Meeting title: "${title}"
Meeting type: ${meetingType}
Attendees: ${attendeeList}
Purpose/context: ${purpose || 'General academic meeting'}
Date: ${date || 'Upcoming'}

Respond ONLY with valid JSON in this exact format:
{
  "agenda": "Full formatted agenda text ready to paste (use newlines for structure)",
  "topics": [
    { "item": "Topic name", "duration_minutes": 5, "description": "Brief note on what to cover" }
  ],
  "estimated_total_minutes": 30,
  "preparation_tips": ["Tip 1", "Tip 2"]
}

Guidelines:
- For 1-on-1 meetings: focus on personal check-in, progress updates, blockers, and next steps
- For group meetings: include welcome/intro, agenda review, main discussion items, action items, closing
- Always include time for questions and wrap-up
- Tailor agenda items to an academic university context (students, research, teaching, committees, grants)
- Keep total meeting time realistic (15-60 minutes based on context)
- Make agenda text formatted with numbered items and time estimates, e.g.: "1. Welcome & Check-in (5 min)\\n2. ..."
- Preparation tips should be practical and specific to the meeting context`;

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
            temperature: 0.5,
            maxOutputTokens: 1024,
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
    console.error('generate-meeting-agenda error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate agenda' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildFallback(title: string, type: string) {
  const is1on1 = type === 'one_on_one' || type === '1:1';
  const agenda = is1on1
    ? `1. Check-in & Updates (5 min)\n2. Progress Review (10 min)\n3. Blockers & Support Needed (5 min)\n4. Action Items & Next Steps (5 min)\n5. Closing (5 min)`
    : `1. Welcome & Introductions (5 min)\n2. Agenda Review (2 min)\n3. Main Discussion: ${title} (20 min)\n4. Action Items & Decisions (8 min)\n5. Next Meeting / Closing (5 min)`;

  return {
    agenda,
    topics: [],
    estimated_total_minutes: is1on1 ? 30 : 40,
    preparation_tips: ['Review previous meeting notes', 'Prepare key discussion points in advance'],
  };
}
