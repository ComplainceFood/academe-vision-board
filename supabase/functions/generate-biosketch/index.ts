import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

type BiosketechFormat = "nih_biosketch" | "nsf_bio" | "academic_summary";

interface Achievement {
  category: string;
  title: string;
  description?: string;
  venue?: string;
  date?: string;
  co_authors?: string[];
  status?: string;
  organization?: string;
  award_type?: string;
  student_name?: string;
  student_level?: string;
  course_code?: string;
  term?: string;
  journal_name?: string;
  impact_factor?: number;
  tags?: string[];
}

function formatAchievementsForPrompt(achievements: Achievement[]): string {
  const byCategory: Record<string, Achievement[]> = {};
  for (const a of achievements) {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
  }

  const lines: string[] = [];

  if (byCategory.publication?.length) {
    lines.push("PUBLICATIONS:");
    byCategory.publication.slice(0, 20).forEach((p) => {
      const year = p.date ? new Date(p.date).getFullYear() : "";
      const doi = p.tags?.find((t) => t.startsWith("doi:"))?.replace("doi:", "");
      lines.push(
        `  - ${p.title}${p.venue ? ` | ${p.venue}` : ""}${p.journal_name ? ` | ${p.journal_name}` : ""}${year ? ` (${year})` : ""}${p.co_authors?.length ? ` | Co-authors: ${p.co_authors.join(", ")}` : ""}${p.impact_factor ? ` | IF: ${p.impact_factor}` : ""}${doi ? ` | DOI: ${doi}` : ""}`
      );
    });
  }

  if (byCategory.award_honor?.length) {
    lines.push("AWARDS & HONORS:");
    byCategory.award_honor.slice(0, 10).forEach((a) => {
      const year = a.date ? new Date(a.date).getFullYear() : "";
      lines.push(`  - ${a.title}${a.organization ? ` | ${a.organization}` : ""}${year ? ` (${year})` : ""}`);
    });
  }

  if (byCategory.leadership_role?.length) {
    lines.push("LEADERSHIP & POSITIONS:");
    byCategory.leadership_role.slice(0, 10).forEach((a) => {
      const year = a.date ? new Date(a.date).getFullYear() : "";
      lines.push(`  - ${a.title}${a.organization ? ` | ${a.organization}` : ""}${year ? ` (${year})` : ""}`);
    });
  }

  if (byCategory.research_presentation?.length) {
    lines.push("RESEARCH PRESENTATIONS:");
    byCategory.research_presentation.slice(0, 10).forEach((a) => {
      const year = a.date ? new Date(a.date).getFullYear() : "";
      lines.push(`  - ${a.title}${a.venue ? ` | ${a.venue}` : ""}${year ? ` (${year})` : ""}`);
    });
  }

  if (byCategory.invited_talk?.length) {
    lines.push("INVITED TALKS:");
    byCategory.invited_talk.slice(0, 10).forEach((a) => {
      const year = a.date ? new Date(a.date).getFullYear() : "";
      lines.push(`  - ${a.title}${a.organization ? ` | ${a.organization}` : ""}${year ? ` (${year})` : ""}`);
    });
  }

  if (byCategory.course_taught?.length) {
    lines.push("COURSES TAUGHT:");
    byCategory.course_taught.slice(0, 10).forEach((a) => {
      lines.push(`  - ${a.title}${a.course_code ? ` (${a.course_code})` : ""}${a.term ? ` | ${a.term}` : ""}`);
    });
  }

  if (byCategory.student_supervision?.length) {
    lines.push("STUDENT SUPERVISION:");
    byCategory.student_supervision.slice(0, 10).forEach((a) => {
      lines.push(`  - ${a.title}${a.student_name ? ` | Student: ${a.student_name}` : ""}${a.student_level ? ` (${a.student_level})` : ""}`);
    });
  }

  if (byCategory.professional_development?.length) {
    lines.push("PROFESSIONAL DEVELOPMENT:");
    byCategory.professional_development.slice(0, 8).forEach((a) => {
      const year = a.date ? new Date(a.date).getFullYear() : "";
      lines.push(`  - ${a.title}${a.organization ? ` | ${a.organization}` : ""}${year ? ` (${year})` : ""}`);
    });
  }

  if (byCategory.external_impact?.length) {
    lines.push("EXTERNAL IMPACT:");
    byCategory.external_impact.slice(0, 8).forEach((a) => {
      lines.push(`  - ${a.title}${a.organization ? ` | ${a.organization}` : ""}`);
    });
  }

  return lines.join("\n");
}

function buildPrompt(
  format: BiosketechFormat,
  profileName: string,
  position: string,
  department: string,
  personalStatement: string,
  achievementsSummary: string
): string {
  const profileBlock = `Name: ${profileName}\nPosition: ${position}\nDepartment/Field: ${department}`;

  if (format === "nih_biosketch") {
    return `You are an expert academic writer helping a researcher write an NIH Biosketch (format page limit: 5 pages).

Researcher profile:
${profileBlock}

Additional context from the researcher:
${personalStatement || "None provided."}

Academic achievements data:
${achievementsSummary}

Generate a complete NIH Biosketch with the following sections. Follow NIH SF424 (R&R) format strictly.

Respond ONLY with valid JSON in this exact structure:
{
  "format": "NIH Biosketch",
  "sections": {
    "personal_statement": "3-5 sentences describing research goals, expertise, and relevance to the field. Should be compelling and concise.",
    "positions_honors": [
      { "year": "YYYY-YYYY or YYYY", "description": "Position title, Institution/Organization" }
    ],
    "contributions_to_science": [
      {
        "heading": "Brief area title (e.g., Machine Learning in Genomics)",
        "narrative": "2-4 sentences describing the contribution and its significance.",
        "citations": ["Up to 4 representative publications from the list above, formatted as: Authors. Title. Journal. Year."]
      }
    ],
    "synergistic_activities": [
      "Activity 1 — one sentence description",
      "Activity 2 — one sentence description"
    ]
  }
}`;
  }

  if (format === "nsf_bio") {
    return `You are an expert academic writer helping a researcher write a 2-page NSF Biographical Sketch.

Researcher profile:
${profileBlock}

Additional context:
${personalStatement || "None provided."}

Academic achievements data:
${achievementsSummary}

Generate a complete NSF Bio Sketch following NSF PAPPG guidelines.

Respond ONLY with valid JSON in this exact structure:
{
  "format": "NSF Biographical Sketch",
  "sections": {
    "professional_preparation": [
      { "institution": "University Name", "location": "City, State", "major": "Field", "degree": "BS/MS/PhD", "year": "YYYY" }
    ],
    "appointments": [
      { "year": "YYYY-present or YYYY-YYYY", "description": "Title, Institution" }
    ],
    "products": {
      "closely_related": ["Up to 5 most relevant publications from the data, formatted as full citations"],
      "other_significant": ["Up to 5 other significant publications"]
    },
    "synergistic_activities": [
      "Activity description — one sentence each, up to 5 activities highlighting broader impact"
    ]
  }
}`;
  }

  // academic_summary
  return `You are an expert academic writer helping a researcher write a concise professional biography for their faculty page or grant cover letter.

Researcher profile:
${profileBlock}

Additional context:
${personalStatement || "None provided."}

Academic achievements data:
${achievementsSummary}

Generate a professional academic biography.

Respond ONLY with valid JSON in this exact structure:
{
  "format": "Academic Summary",
  "sections": {
    "short_bio": "One paragraph (4-6 sentences) professional bio suitable for a conference or faculty page. Third person.",
    "research_interests": ["Interest 1", "Interest 2", "Interest 3"],
    "selected_publications": ["Up to 5 representative publications as full citations"],
    "key_achievements": ["Achievement 1", "Achievement 2", "Achievement 3", "Achievement 4", "Achievement 5"]
  }
}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration missing");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Authentication failed");

    const { format, personalStatement } = await req.json() as {
      format: BiosketechFormat;
      personalStatement?: string;
    };

    if (!["nih_biosketch", "nsf_bio", "academic_summary"].includes(format)) {
      return new Response(
        JSON.stringify({ error: "Invalid format. Use nih_biosketch, nsf_bio, or academic_summary." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profile and achievements
    const [profileResult, achievementsResult] = await Promise.all([
      supabase.from("profiles").select("display_name, first_name, last_name, position, department").eq("user_id", user.id).single(),
      supabase.from("scholastic_achievements").select("*").eq("user_id", user.id),
    ]);

    const profile = profileResult.data;
    const achievements: Achievement[] = achievementsResult.data ?? [];

    const profileName =
      profile?.display_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Researcher";
    const position = profile?.position ?? "Faculty";
    const department = profile?.department ?? "Academic Department";

    const achievementsSummary = formatAchievementsForPrompt(achievements);

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add GEMINI_API_KEY to Supabase secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(format, profileName, position, department, personalStatement ?? "", achievementsSummary);

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON in AI response");

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ ...result, profileName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-biosketch error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate biosketch" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
