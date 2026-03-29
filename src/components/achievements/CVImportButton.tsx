import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Loader2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedAchievement {
  category: string;
  title: string;
  description?: string | null;
  venue?: string | null;
  journal_name?: string | null;
  date?: string | null;
  co_authors?: string[] | null;
  url?: string | null;
  impact_factor?: number | null;
  status: string;
  organization?: string | null;
  award_type?: string | null;
  student_name?: string | null;
  student_level?: string | null;
  course_code?: string | null;
  term?: string | null;
  tags?: string[] | null;
  visibility: string;
  selected?: boolean;
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  publication:            { label: "Publications",           color: "bg-blue-100 text-blue-700 border-blue-200" },
  research_presentation:  { label: "Research Presentations", color: "bg-purple-100 text-purple-700 border-purple-200" },
  invited_talk:           { label: "Invited Talks",          color: "bg-violet-100 text-violet-700 border-violet-200" },
  leadership_role:        { label: "Leadership Roles",       color: "bg-amber-100 text-amber-700 border-amber-200" },
  course_taught:          { label: "Courses Taught",         color: "bg-green-100 text-green-700 border-green-200" },
  award_honor:            { label: "Awards & Honors",        color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  service_review:         { label: "Service & Reviews",      color: "bg-teal-100 text-teal-700 border-teal-200" },
  student_supervision:    { label: "Student Supervision",    color: "bg-pink-100 text-pink-700 border-pink-200" },
  teaching_performance:   { label: "Teaching Performance",   color: "bg-orange-100 text-orange-700 border-orange-200" },
  professional_development:{ label: "Professional Development", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  external_impact:        { label: "External Impact",        color: "bg-rose-100 text-rose-700 border-rose-200" },
};

// ─── PDF text extraction ─────────────────────────────────────────────────────

async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  // Use CDN worker to avoid bundling it
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    texts.push(pageText);
  }

  return texts.join("\n");
}

// ─── DOCX text extraction ─────────────────────────────────────────────────────

async function extractTextFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CVImportButtonProps {
  onImportComplete: () => void;
}

type Step = "idle" | "extracting" | "parsing" | "preview" | "importing" | "done";

export function CVImportButton({ onImportComplete }: CVImportButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [open, setOpen] = useState(false);
  const [parsedName, setParsedName] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<ParsedAchievement[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetState = () => {
    setStep("idle");
    setParsedName(null);
    setAchievements([]);
    setCollapsedCategories(new Set());
    setErrorMsg(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx");

    if (!isPdf && !isDocx) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or Word (.docx) file.",
        variant: "destructive",
      });
      return;
    }

    setOpen(true);
    setErrorMsg(null);
    setStep("extracting");

    let cvText = "";
    try {
      cvText = isPdf
        ? await extractTextFromPdf(file)
        : await extractTextFromDocx(file);

      if (cvText.trim().length < 50) {
        throw new Error("Could not extract readable text from the file. Try a text-based PDF (not a scanned image).");
      }
    } catch (err: any) {
      setStep("idle");
      setErrorMsg(err.message || "Failed to read file.");
      return;
    }

    setStep("parsing");
    try {
      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { cvText },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const items: ParsedAchievement[] = (data.achievements ?? []).map((a: ParsedAchievement) => ({
        ...a,
        selected: true,
      }));

      setParsedName(data.name ?? null);
      setAchievements(items);
      setStep("preview");
    } catch (err: any) {
      setStep("idle");
      setErrorMsg(err.message || "AI parsing failed. Please try again.");
    }
  };

  const toggleItem = (index: number) => {
    setAchievements((prev) =>
      prev.map((a, i) => (i === index ? { ...a, selected: !a.selected } : a))
    );
  };

  const toggleCategory = (category: string) => {
    const categoryItems = achievements.filter((a) => a.category === category);
    const allSelected = categoryItems.every((a) => a.selected);
    setAchievements((prev) =>
      prev.map((a) => (a.category === category ? { ...a, selected: !allSelected } : a))
    );
  };

  const toggleCollapse = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const selectedCount = achievements.filter((a) => a.selected).length;

  const handleImport = async () => {
    const toImport = achievements
      .filter((a) => a.selected)
      .map(({ selected: _sel, ...rest }) => ({
        ...rest,
        user_id: user?.id,
      }));

    if (toImport.length === 0) return;

    setStep("importing");
    try {
      // Insert in batches of 50
      for (let i = 0; i < toImport.length; i += 50) {
        const batch = toImport.slice(i, i + 50);
        const { error } = await supabase.from("scholastic_achievements").insert(batch);
        if (error) throw error;
      }

      setStep("done");
      toast({
        title: "CV imported successfully!",
        description: `${toImport.length} achievement${toImport.length !== 1 ? "s" : ""} added to your profile.`,
      });
      onImportComplete();
    } catch (err: any) {
      setStep("preview");
      toast({
        title: "Import failed",
        description: err.message || "Could not save achievements. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Group by category preserving order
  const grouped = Object.entries(CATEGORY_META)
    .map(([cat]) => ({
      category: cat,
      items: achievements
        .map((a, idx) => ({ ...a, _idx: idx }))
        .filter((a) => a.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const statusLabel: Record<Step, string> = {
    idle: "",
    extracting: "Reading file…",
    parsing: "AI is parsing your CV…",
    preview: "",
    importing: "Saving achievements…",
    done: "Done!",
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant="secondary"
        className="gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-primary-foreground/20"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Import CV
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetState();
          setOpen(v);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import from CV
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]">AI-Powered</Badge>
            </DialogTitle>
            <DialogDescription>
              {step === "preview"
                ? `Found ${achievements.length} achievements${parsedName ? ` for ${parsedName}` : ""}. Review and deselect anything you don't want to import.`
                : "Extracting and parsing your CV…"}
            </DialogDescription>
          </DialogHeader>

          {/* Loading states */}
          {(step === "extracting" || step === "parsing" || step === "importing") && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-500" />
              </div>
              <div className="text-center">
                <p className="font-medium">{statusLabel[step]}</p>
                {step === "parsing" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    This usually takes 10–20 seconds
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {step === "idle" && errorMsg && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-center text-muted-foreground max-w-sm">{errorMsg}</p>
              <Button
                variant="outline"
                onClick={() => { resetState(); setOpen(false); }}
              >
                Close
              </Button>
            </div>
          )}

          {/* Done state */}
          {step === "done" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-semibold text-lg">Import complete!</p>
              <p className="text-sm text-muted-foreground">
                {selectedCount} achievement{selectedCount !== 1 ? "s" : ""} added to your profile.
              </p>
              <Button onClick={() => { resetState(); setOpen(false); }}>Done</Button>
            </div>
          )}

          {/* Preview */}
          {step === "preview" && (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between py-2 border-b shrink-0">
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedCount}</span> of {achievements.length} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setAchievements((p) => p.map((a) => ({ ...a, selected: true })))}
                  >
                    Select all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setAchievements((p) => p.map((a) => ({ ...a, selected: false })))}
                  >
                    Deselect all
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-4 py-2">
                  {grouped.map(({ category, items }) => {
                    const meta = CATEGORY_META[category];
                    const allSelected = items.every((a) => a.selected);
                    const someSelected = items.some((a) => a.selected);
                    const isCollapsed = collapsedCategories.has(category);

                    return (
                      <div key={category} className="border rounded-lg overflow-hidden">
                        {/* Category header */}
                        <div className="flex items-center gap-3 p-3 bg-muted/30 cursor-pointer select-none"
                          onClick={() => toggleCollapse(category)}>
                          <Checkbox
                            checked={allSelected}
                            data-state={someSelected && !allSelected ? "indeterminate" : undefined}
                            onCheckedChange={() => toggleCategory(category)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${meta.color}`}>
                              {meta.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {items.filter((a) => a.selected).length}/{items.length}
                            </span>
                          </div>
                          {isCollapsed
                            ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>

                        {/* Items */}
                        {!isCollapsed && (
                          <div className="divide-y">
                            {items.map((item) => (
                              <div
                                key={item._idx}
                                className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                                  item.selected ? "bg-background" : "bg-muted/20"
                                }`}
                                onClick={() => toggleItem(item._idx)}
                              >
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={() => toggleItem(item._idx)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium leading-snug ${!item.selected ? "text-muted-foreground" : ""}`}>
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {[
                                      item.venue,
                                      item.journal_name,
                                      item.organization,
                                      item.date ? new Date(item.date).getFullYear() : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                  {item.co_authors?.length ? (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                      {item.co_authors.join(", ")}
                                    </p>
                                  ) : null}
                                </div>
                                <Badge variant="outline" className="text-[9px] px-1 shrink-0 mt-0.5">
                                  {item.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <DialogFooter className="shrink-0 pt-3 border-t">
                <Button variant="outline" onClick={() => { resetState(); setOpen(false); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Import {selectedCount} achievement{selectedCount !== 1 ? "s" : ""}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
