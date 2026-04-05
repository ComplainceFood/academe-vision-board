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
    const { title, agenda, notes } = await req.json();

    if (!notes && !agenda) {
      return new Response(
        JSON.stringify({ error: 'No meeting content provided to summarize' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = [
      title ? `Meeting: ${title}` : '',
      agenda ? `Agenda:\n${agenda}` : '',
      notes ? `Notes / Minutes:\n${notes}` : '',
    ].filter(Boolean).join('\n\n');

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify(buildFallback(notes || agenda)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an assistant helping academic professionals manage meetings.

Given the following meeting content, produce:
1. A concise summary (2-4 sentences) of what was discussed or planned.
2. A list of clear, specific action items that need to be followed up on.

Meeting content:
${content}

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "action_items": ["...", "...", "..."]
}`;

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
            temperature: 0.4,
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
    console.error('summarize-meeting error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to summarize meeting content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildFallback(text: string) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const summary = sentences.slice(0, 3).join('. ') + '.';
  return { summary, action_items: [] };
}
