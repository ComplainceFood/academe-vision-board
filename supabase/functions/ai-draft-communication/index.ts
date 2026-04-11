import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topic, category, priority, key_points, tone } = await req.json();

    if (!topic?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify(buildFallback(topic, category)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const toneDesc = tone === 'formal' ? 'formal and professional'
      : tone === 'friendly' ? 'warm and approachable'
      : tone === 'urgent' ? 'urgent and direct'
      : 'clear and professional';

    const prompt = `You are an assistant helping a university administrator draft official communications for faculty, staff, and students.
Today: ${today}

Draft a complete communication for the following:
- Topic / main subject: "${topic}"
- Category: ${category || 'general'}
- Priority level: ${priority || 'normal'}
- Key points to cover: ${key_points || 'Not specified — infer from topic'}
- Tone: ${toneDesc}

Respond ONLY with valid JSON, no markdown fences:
{
  "title": "Clear, specific subject line (max 100 chars)",
  "description": "One sentence summary suitable as a subtitle (max 200 chars)",
  "content": "Full communication body (3-5 paragraphs, suitable for academic institutional communication, plain text with paragraph breaks using \\n\\n)"
}

Guidelines:
- Title should be specific and informative, not generic
- Content should open with context, cover key points, include any action required, and close with contact/next steps
- Use inclusive, professional language appropriate for a university setting
- Keep each paragraph focused; do not use bullet points in the content field
- If priority is urgent, open with a clear statement of urgency`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');

    return new Response(jsonMatch[0], {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ai-draft-communication error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildFallback(topic: string, category: string) {
  return {
    title: topic.length > 100 ? topic.slice(0, 97) + '...' : topic,
    description: `Official communication regarding: ${topic}`,
    content: `Dear Members of the University Community,\n\nThis communication is to inform you about the following: ${topic}.\n\nPlease review the information carefully and take any necessary action. If you have questions or require further clarification, do not hesitate to reach out to the appropriate department.\n\nThank you for your attention to this matter.\n\nBest regards,\nAdministration`,
  };
}
