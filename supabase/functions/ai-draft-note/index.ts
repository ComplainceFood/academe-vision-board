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
    const { rough_description, today } = await req.json();

    if (!rough_description?.trim()) {
      return new Response(
        JSON.stringify({ error: 'No description provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify(buildFallback(rough_description)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an assistant helping academic professionals (professors, lecturers, researchers) create well-structured task notes.

Given a rough description from a professor, generate a complete, well-structured task note.

Rough description: "${rough_description}"
Today's date: ${today || new Date().toISOString().split('T')[0]}

Respond ONLY with valid JSON in this exact format:
{
  "title": "A clear, concise task title (max 80 chars)",
  "description": "A well-written 2-4 sentence description expanding on the task with relevant academic context",
  "priority": "low|medium|high|urgent",
  "category": "teaching|students|admin|meetings|grading",
  "suggested_due_date": "YYYY-MM-DD or null if not determinable",
  "subtasks": ["subtask 1", "subtask 2", "subtask 3"],
  "reasoning": "1-2 sentences explaining the priority and due date choices"
}

Guidelines:
- Priority: "urgent" if time-sensitive (today/tomorrow), "high" if this week, "medium" for near-future, "low" for ongoing
- Category: pick the most appropriate academic category
- Subtasks: break the task into 2-4 concrete steps (empty array if task is simple)
- Due date: infer from context clues (e.g. "end of week" = nearest Friday, "before class" = tomorrow, "next semester" = ~4 months out); null if genuinely unclear
- Keep the writing professional and suitable for an academic context`;

    const response = await fetch(
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
    console.error('ai-draft-note error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to draft note' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildFallback(rough: string) {
  const words = rough.trim().split(/\s+/);
  const title = words.slice(0, 10).join(' ');
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: rough.trim(),
    priority: 'medium',
    category: 'admin',
    suggested_due_date: null,
    subtasks: [],
    reasoning: 'AI unavailable - please set priority and due date manually.',
  };
}
