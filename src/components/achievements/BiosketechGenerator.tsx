import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Download,
  ChevronRight,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { exportAchievementsToDocx } from "@/utils/resumeExport";
import type { Achievement } from "@/types/achievements";

type BiosketechFormat = "nih_biosketch" | "nsf_bio" | "academic_summary";

const FORMAT_OPTIONS: { value: BiosketechFormat; label: string; badge: string; description: string }[] = [
  {
    value: "nih_biosketch",
    label: "NIH Biosketch",
    badge: "NIH",
    description: "5-page format: Personal Statement, Positions & Honors, Contributions to Science, Synergistic Activities",
  },
  {
    value: "nsf_bio",
    label: "NSF Biographical Sketch",
    badge: "NSF",
    description: "2-page format: Professional Preparation, Appointments, Products (publications), Synergistic Activities",
  },
  {
    value: "academic_summary",
    label: "Academic Summary",
    badge: "General",
    description: "Short professional bio, research interests, selected publications — for faculty pages or cover letters",
  },
];

interface BiosketechGeneratorProps {
  achievements: Achievement[];
}

// Render any biosketch result as readable sections
function BiosketechPreview({ data }: { data: Record<string, any> }) {
  const sections = data.sections ?? {};
  const format: string = data.format ?? "";

  const renderValue = (val: any): string => {
    if (typeof val === "string") return val;
    if (typeof val === "object" && val !== null) return JSON.stringify(val, null, 2);
    return String(val ?? "");
  };

  if (format === "NIH Biosketch") {
    return (
      <div className="space-y-5 text-sm">
        {sections.personal_statement && (
          <Section title="A. Personal Statement">
            <p className="text-muted-foreground leading-relaxed">{sections.personal_statement}</p>
          </Section>
        )}
        {sections.positions_honors?.length > 0 && (
          <Section title="B. Positions, Scientific Appointments & Honors">
            <ul className="space-y-1">
              {sections.positions_honors.map((item: any, i: number) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <span className="font-mono text-xs shrink-0 pt-0.5 text-foreground/60 w-24">{item.year}</span>
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {sections.contributions_to_science?.length > 0 && (
          <Section title="C. Contributions to Science">
            <div className="space-y-4">
              {sections.contributions_to_science.map((contrib: any, i: number) => (
                <div key={i}>
                  <p className="font-semibold text-foreground">{i + 1}. {contrib.heading}</p>
                  <p className="text-muted-foreground mt-1 leading-relaxed">{contrib.narrative}</p>
                  {contrib.citations?.length > 0 && (
                    <ul className="mt-2 space-y-1 pl-4 list-disc">
                      {contrib.citations.map((c: string, ci: number) => (
                        <li key={ci} className="text-xs text-muted-foreground">{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
        {sections.synergistic_activities?.length > 0 && (
          <Section title="D. Synergistic Activities">
            <ul className="space-y-1 list-disc pl-4">
              {sections.synergistic_activities.map((a: string, i: number) => (
                <li key={i} className="text-muted-foreground">{a}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    );
  }

  if (format === "NSF Biographical Sketch") {
    return (
      <div className="space-y-5 text-sm">
        {sections.professional_preparation?.length > 0 && (
          <Section title="Professional Preparation">
            <table className="w-full text-muted-foreground text-xs">
              <thead><tr className="text-foreground/70 border-b">
                <th className="text-left pb-1">Institution</th>
                <th className="text-left pb-1">Location</th>
                <th className="text-left pb-1">Major</th>
                <th className="text-left pb-1">Degree</th>
                <th className="text-left pb-1">Year</th>
              </tr></thead>
              <tbody>
                {sections.professional_preparation.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-muted/40">
                    <td className="py-1 pr-2">{p.institution}</td>
                    <td className="py-1 pr-2">{p.location}</td>
                    <td className="py-1 pr-2">{p.major}</td>
                    <td className="py-1 pr-2">{p.degree}</td>
                    <td className="py-1">{p.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
        {sections.appointments?.length > 0 && (
          <Section title="Appointments">
            <ul className="space-y-1">
              {sections.appointments.map((a: any, i: number) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <span className="font-mono text-xs shrink-0 pt-0.5 w-24">{a.year}</span>
                  <span>{a.description}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {sections.products && (
          <Section title="Products">
            {sections.products.closely_related?.length > 0 && (
              <>
                <p className="font-medium text-xs uppercase tracking-wide text-foreground/60 mb-2">Closely Related</p>
                <ol className="list-decimal pl-5 space-y-1">
                  {sections.products.closely_related.map((p: string, i: number) => (
                    <li key={i} className="text-muted-foreground text-xs">{p}</li>
                  ))}
                </ol>
              </>
            )}
            {sections.products.other_significant?.length > 0 && (
              <>
                <p className="font-medium text-xs uppercase tracking-wide text-foreground/60 mb-2 mt-3">Other Significant</p>
                <ol className="list-decimal pl-5 space-y-1">
                  {sections.products.other_significant.map((p: string, i: number) => (
                    <li key={i} className="text-muted-foreground text-xs">{p}</li>
                  ))}
                </ol>
              </>
            )}
          </Section>
        )}
        {sections.synergistic_activities?.length > 0 && (
          <Section title="Synergistic Activities">
            <ol className="list-decimal pl-5 space-y-1">
              {sections.synergistic_activities.map((a: string, i: number) => (
                <li key={i} className="text-muted-foreground">{a}</li>
              ))}
            </ol>
          </Section>
        )}
      </div>
    );
  }

  // Academic Summary
  return (
    <div className="space-y-5 text-sm">
      {sections.short_bio && (
        <Section title="Professional Bio">
          <p className="text-muted-foreground leading-relaxed">{sections.short_bio}</p>
        </Section>
      )}
      {sections.research_interests?.length > 0 && (
        <Section title="Research Interests">
          <div className="flex flex-wrap gap-2">
            {sections.research_interests.map((r: string, i: number) => (
              <Badge key={i} variant="secondary">{r}</Badge>
            ))}
          </div>
        </Section>
      )}
      {sections.selected_publications?.length > 0 && (
        <Section title="Selected Publications">
          <ol className="list-decimal pl-5 space-y-1">
            {sections.selected_publications.map((p: string, i: number) => (
              <li key={i} className="text-muted-foreground text-xs">{p}</li>
            ))}
          </ol>
        </Section>
      )}
      {sections.key_achievements?.length > 0 && (
        <Section title="Key Achievements">
          <ul className="list-disc pl-5 space-y-1">
            {sections.key_achievements.map((a: string, i: number) => (
              <li key={i} className="text-muted-foreground">{a}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );

  function renderFallback() {
    return (
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
        {JSON.stringify(sections, null, 2)}
      </pre>
    );
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-foreground border-b pb-1 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function BiosketechGenerator({ achievements }: BiosketechGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<BiosketechFormat>("nih_biosketch");
  const [personalStatement, setPersonalStatement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("generate-biosketch", {
        body: { format: selectedFormat, personalStatement },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      console.error("Biosketch generation error:", err);
      toast({
        title: "Generation failed",
        description: err.message || "Could not generate biosketch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = JSON.stringify(result.sections, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownloadDocx = async () => {
    if (!result) return;
    // Build plain text from sections and export as a simple docx description block
    await exportAchievementsToDocx(achievements, {
      userName: result.profileName,
      includeDescription: true,
    });
    toast({ title: "Downloading achievements resume as .docx" });
  };

  return (
    <>
      <Button
        variant="secondary"
        className="gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-primary-foreground/20"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        AI Biosketch
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Biosketch Generator
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]">Premium</Badge>
            </DialogTitle>
            <DialogDescription>
              Generate a grant-ready biosketch from your achievements. Powered by AI.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
            {/* Left: config panel */}
            <div className="lg:w-72 space-y-4 shrink-0">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Format</Label>
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setSelectedFormat(opt.value); setResult(null); }}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedFormat === opt.value
                        ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30"
                        : "border-muted-foreground/20 hover:border-violet-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{opt.label}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{opt.badge}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{opt.description}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="personal-stmt" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Research focus / context <span className="font-normal normal-case">(optional)</span>
                </Label>
                <Textarea
                  id="personal-stmt"
                  placeholder="Briefly describe your research focus, the grant you're applying for, or any specific emphasis you'd like the AI to highlight…"
                  value={personalStatement}
                  onChange={(e) => setPersonalStatement(e.target.value)}
                  className="text-sm resize-none h-28"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || achievements.length === 0}
                className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGenerating ? "Generating…" : "Generate Biosketch"}
              </Button>

              {achievements.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Add achievements first to generate a biosketch.
                </p>
              )}

              {result && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleDownloadDocx}>
                    <Download className="h-3.5 w-3.5" />
                    .docx
                  </Button>
                </div>
              )}
            </div>

            {/* Right: preview */}
            <div className="flex-1 border rounded-lg overflow-hidden">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  <p className="text-sm">Generating your biosketch…</p>
                  <p className="text-xs opacity-60">This usually takes 10–20 seconds</p>
                </div>
              ) : result ? (
                <ScrollArea className="h-full">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-bold text-base">{result.profileName}</h2>
                        <p className="text-xs text-muted-foreground">{result.format}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Generated</Badge>
                    </div>
                    <BiosketechPreview data={result} />
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
                  <FileText className="h-10 w-10 opacity-30" />
                  <p className="text-sm text-center">
                    Select a format and click <strong>Generate Biosketch</strong> to create your AI-powered biosketch from your achievements data.
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-violet-600 mt-2">
                    <ChevronRight className="h-3.5 w-3.5" />
                    {achievements.length} achievements ready to use
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
