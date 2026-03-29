import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, FileType, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Achievement } from "@/types/achievements";
import { exportAchievementsToDocx } from "@/utils/resumeExport";
import { exportAchievementsToPdf } from "@/utils/pdfExport";

type ExportFormat = "docx" | "pdf";

const SECTION_OPTIONS = [
  { category: "publication", label: "Publications" },
  { category: "research_presentation", label: "Research Presentations" },
  { category: "invited_talk", label: "Invited Talks" },
  { category: "leadership_role", label: "Leadership Roles" },
  { category: "course_taught", label: "Courses Taught" },
  { category: "award_honor", label: "Awards & Honors" },
  { category: "service_review", label: "Service & Reviews" },
  { category: "student_supervision", label: "Student Supervision" },
  { category: "teaching_performance", label: "Teaching Performance" },
  { category: "professional_development", label: "Professional Development" },
  { category: "external_impact", label: "External Impact" },
] as const;

interface ResumeExportButtonProps {
  achievements: Achievement[];
  userName?: string;
}

export function ResumeExportButton({ achievements, userName }: ResumeExportButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("docx");
  const [includeDescription, setIncludeDescription] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(SECTION_OPTIONS.map((s) => s.category))
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCategories.size === SECTION_OPTIONS.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(SECTION_OPTIONS.map((s) => s.category)));
    }
  };

  const getCategoryCount = (category: string) =>
    achievements.filter((a) => a.category === category).length;

  const handleExport = async () => {
    const filtered = achievements.filter((a) => selectedCategories.has(a.category));
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Select at least one section with achievements.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const opts = { userName, includeDescription };
      if (format === "pdf") {
        await exportAchievementsToPdf(filtered, opts);
      } else {
        await exportAchievementsToDocx(filtered, opts);
      }
      toast({
        title: "Resume exported",
        description: `Your ATS-scannable resume has been downloaded as .${format}.`,
      });
      setOpen(false);
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export failed",
        description: "Could not generate the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const totalSelected = achievements.filter((a) => selectedCategories.has(a.category)).length;

  return (
    <>
      <Button
        variant="secondary"
        className="gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border-primary-foreground/20"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-4 w-4" />
        Export Resume
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Resume
            </DialogTitle>
            <DialogDescription>
              Generate an ATS-scannable resume from your achievements. Choose format and sections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Format selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("docx")}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  format === "docx"
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Word (.docx)</p>
                  <p className="text-[10px] opacity-70">Editable, ATS-safe</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  format === "pdf"
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <FileType className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">PDF (.pdf)</p>
                  <p className="text-[10px] opacity-70">Universal, portable</p>
                </div>
              </button>
            </div>

            {/* Section selector */}
            <div className="flex items-center justify-between border-b pb-3">
              <Label className="text-sm font-semibold">Sections to include</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7 px-2">
                {selectedCategories.size === SECTION_OPTIONS.length ? "Deselect all" : "Select all"}
              </Button>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {SECTION_OPTIONS.map(({ category, label }) => {
                const count = getCategoryCount(category);
                return (
                  <div key={category} className="flex items-center gap-3">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={selectedCategories.has(category)}
                      onCheckedChange={() => toggleCategory(category)}
                      disabled={count === 0}
                    />
                    <Label
                      htmlFor={`cat-${category}`}
                      className={`flex-1 text-sm cursor-pointer flex justify-between ${count === 0 ? "text-muted-foreground" : ""}`}
                    >
                      <span>{label}</span>
                      <span className="text-muted-foreground text-xs">
                        {count === 0 ? "none" : `${count} item${count !== 1 ? "s" : ""}`}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>

            {/* Options */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include-desc"
                  checked={includeDescription}
                  onCheckedChange={(v) => setIncludeDescription(!!v)}
                />
                <Label htmlFor="include-desc" className="text-sm cursor-pointer">
                  Include descriptions / abstracts
                </Label>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              Plain formatting with no tables or graphics — optimized for ATS parsers. Entries are ordered reverse-chronologically within each section.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || totalSelected === 0}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export {totalSelected > 0 ? `${totalSelected} items` : ""} as .{format}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
