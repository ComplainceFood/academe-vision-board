import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, ArrowRight, FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FundingSource, FundingExpenditure } from "@/types/funding";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";

interface GrantAINarrativeProps {
  sources: FundingSource[];
}

interface NarrativeResult {
  narrative: string;
  key_accomplishments: string[];
  next_steps: string[];
  budget_note: string;
  risk_flags: string[];
}

type NarrativeType = "progress_report" | "budget_justification" | "executive_summary";

const NARRATIVE_TYPES: { value: NarrativeType; label: string; description: string }[] = [
  { value: "progress_report", label: "Progress Report", description: "Activities, milestones & outcomes" },
  { value: "budget_justification", label: "Budget Justification", description: "Spending rationale & fund use" },
  { value: "executive_summary", label: "Executive Summary", description: "High-level overview of grant status" },
];

export function GrantAINarrative({ sources }: GrantAINarrativeProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGrantId, setSelectedGrantId] = useState<string>("");
  const [narrativeType, setNarrativeType] = useState<NarrativeType>("progress_report");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<NarrativeResult | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const { data: expenditures } = useDataFetching<FundingExpenditure>({
    table: "funding_expenditures",
    enabled: !!user && !!selectedGrantId,
    filters: selectedGrantId ? [{ column: "funding_source_id", value: selectedGrantId }] : [],
  });

  const { data: grantMeetings } = useDataFetching<any>({
    table: "meetings",
    enabled: !!user && !!selectedGrantId,
    filters: selectedGrantId ? [{ column: "funding_source_id", value: selectedGrantId }] : [],
  });

  const { data: grantNotes } = useDataFetching<any>({
    table: "notes",
    enabled: !!user && !!selectedGrantId,
    filters: selectedGrantId ? [{ column: "funding_source_id", value: selectedGrantId }] : [],
  });

  const selectedGrant = sources.find(s => s.id === selectedGrantId);

  const handleGenerate = async () => {
    if (!selectedGrant) {
      toast({ title: "Select a grant first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-grant-narrative", {
        body: {
          grant: selectedGrant,
          expenditures: expenditures || [],
          meetings: grantMeetings || [],
          notes: grantNotes || [],
          narrative_type: narrativeType,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data as NarrativeResult);
      setExpanded(true);
      toast({ title: "Narrative generated", description: "Review and copy for use in reports." });
    } catch (err) {
      console.error("Grant narrative error:", err);
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = [
      result.narrative,
      "",
      "Key Accomplishments:",
      ...result.key_accomplishments.map(a => `• ${a}`),
      "",
      "Next Steps:",
      ...result.next_steps.map(s => `• ${s}`),
      "",
      `Budget Status: ${result.budget_note}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const selectedType = NARRATIVE_TYPES.find(t => t.value === narrativeType);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          AI Grant Narrative Writer
          <Badge variant="secondary" className="text-xs ml-1">Beta</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Select Grant</label>
            <Select value={selectedGrantId} onValueChange={setSelectedGrantId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a grant…" />
              </SelectTrigger>
              <SelectContent>
                {sources.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
                {sources.length === 0 && (
                  <SelectItem value="none" disabled>No grants available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Narrative Type</label>
            <Select value={narrativeType} onValueChange={(v) => setNarrativeType(v as NarrativeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NARRATIVE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedGrant && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
            <span>Budget: <strong>${selectedGrant.total_amount.toLocaleString()}</strong></span>
            <span>Remaining: <strong>${selectedGrant.remaining_amount.toLocaleString()}</strong></span>
            <span>Status: <strong className="capitalize">{selectedGrant.status}</strong></span>
            {selectedType && <span>Type: <strong>{selectedType.label}</strong></span>}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedGrantId}
          className="w-full"
        >
          {isGenerating
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Narrative…</>
            : <><FileText className="h-4 w-4 mr-2" />Generate {selectedType?.label || "Narrative"}</>}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Generated Narrative
              </h4>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-7 text-xs">
                  {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                  {expanded ? "Collapse" : "Expand"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs">
                  {copied ? <><Check className="h-3 w-3 mr-1" />Copied</> : <><Copy className="h-3 w-3 mr-1" />Copy All</>}
                </Button>
              </div>
            </div>

            {expanded && (
              <div className="space-y-4">
                {/* Main narrative */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-line">{result.narrative}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Key accomplishments */}
                  {result.key_accomplishments?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Accomplishments</h5>
                      <ul className="space-y-1.5">
                        {result.key_accomplishments.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-600" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next steps */}
                  {result.next_steps?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Steps</h5>
                      <ul className="space-y-1.5">
                        {result.next_steps.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Budget note */}
                {result.budget_note && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Budget Status:</strong> {result.budget_note}
                    </p>
                  </div>
                )}

                {/* Risk flags */}
                {result.risk_flags?.length > 0 && result.risk_flags[0] && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Flags to Review
                    </div>
                    {result.risk_flags.map((flag, i) => (
                      <p key={i} className="text-sm text-amber-700 dark:text-amber-400">{flag}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
