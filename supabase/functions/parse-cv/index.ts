import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const EXTRACTION_PROMPT = `You are an expert academic CV parser. Extract ALL academic achievements from this CV text and return them as structured JSON.

Category mapping - use EXACTLY these values:
- "publication": journal articles, book chapters, books, conference papers, working papers, preprints, reports
- "research_presentation": conference presentations, symposium talks, poster presentations
- "invited_talk": keynote speeches, invited seminars, guest lectures, named lectures, panels
- "leadership_role": administrative positions, committee chairs, editorial board roles, department roles, society officer
- "course_taught": courses, seminars, workshops taught (NOT attended)
- "award_honor": grants awarded, fellowships, prizes, honors, scholarships received
- "service_review": peer review work, journal editorial roles, grant panel reviewer, committee service
- "student_supervision": graduate students advised, postdocs supervised, undergraduate researchers mentored
- "teaching_performance": teaching evaluations with scores, teaching awards
- "professional_development": workshops attended, certifications earned, training completed
- "external_impact": media appearances, patents, policy documents, community engagement, industry consulting

Status values - use EXACTLY: "published", "accepted", "submitted", "completed", "in_progress"

Return ONLY valid JSON, no markdown fences, in this exact structure:
{
  "name": "Full name extracted from CV header, or null",
  "total": <number of achievements>,
  "achievements": [
    {
      "category": "<one of the 11 categories above>",
      "title": "<full title of the work/award/course/role>",
      "description": "<brief description or abstract if present, else null>",
      "venue": "<conference name, journal, or location if applicable, else null>",
      "journal_name": "<journal name for publications, else null>",
      "date": "<YYYY-MM-DD if full date known, YYYY-01-01 if only year, null if unknown>",
      "co_authors": ["<name>"] or null,
      "url": "<DOI URL or other URL if present, else null>",
      "impact_factor": <number if mentioned, else null>,
      "status": "<see status values above>",
      "organization": "<institution or organization name if applicable, else null>",
      "award_type": "<e.g. Best Paper, Fellowship, Grant - for award_honor category, else null>",
      "student_name": "<student full name for supervision, else null>",
      "student_level": "<undergraduate|masters|phd|postdoc for supervision, else null>",
      "course_code": "<course number like CS101 if present, else null>",
      "term": "<e.g. Spring 2023, Fall 2022 if known, else null>",
      "tags": ["<relevant tag>"] or null
    }
  ]
}

Rules:
- Extract EVERY item you find - be thorough, miss nothing
- For publications: always try to extract co-authors, year, and journal/venue
- For courses: if taught multiple times, create one entry with the most recent term
- Default status to "completed" for past items, "published" for publications
- Combine volume/issue/pages into description if present
- If year is listed as a range (e.g. 2019-2021), use the start year`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText } = await req.json() as { cvText: string };

    if (!cvText || cvText.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "CV text is too short or empty." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Add GEMINI_API_KEY to Supabase secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trim to 30k chars to stay within token limits (a 15-page CV is ~12k chars)
    const trimmedText = cvText.slice(0, 30000);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: EXTRACTION_PROMPT },
                { text: "\n\nCV TEXT TO PARSE:\n\n" + trimmedText },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // low temperature for structured extraction
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown fences if present
    const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON found in AI response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and sanitize achievements
    const validCategories = new Set([
      "publication", "research_presentation", "invited_talk", "leadership_role",
      "course_taught", "award_honor", "service_review", "student_supervision",
      "teaching_performance", "professional_development", "external_impact",
    ]);
    const validStatuses = new Set(["published", "accepted", "submitted", "completed", "in_progress"]);

    const achievements = (parsed.achievements ?? [])
      .filter((a: any) => a.title && validCategories.has(a.category))
      .map((a: any) => ({
        ...a,
        status: validStatuses.has(a.status) ? a.status : "completed",
        visibility: "private",
      }));

    return new Response(
      JSON.stringify({
        name: parsed.name ?? null,
        total: achievements.length,
        achievements,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("parse-cv error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to parse CV" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
