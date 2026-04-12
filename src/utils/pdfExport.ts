import { jsPDF } from "jspdf";
import { Achievement } from "@/types/achievements";

// Mirror of section order in resumeExport.ts
const SECTION_ORDER: { category: Achievement["category"]; label: string }[] = [
  { category: "publication", label: "PUBLICATIONS" },
  { category: "research_presentation", label: "RESEARCH PRESENTATIONS" },
  { category: "invited_talk", label: "INVITED TALKS" },
  { category: "leadership_role", label: "LEADERSHIP ROLES" },
  { category: "course_taught", label: "COURSES TAUGHT" },
  { category: "award_honor", label: "AWARDS & HONORS" },
  { category: "service_review", label: "SERVICE & REVIEWS" },
  { category: "student_supervision", label: "STUDENT SUPERVISION" },
  { category: "teaching_performance", label: "TEACHING PERFORMANCE" },
  { category: "professional_development", label: "PROFESSIONAL DEVELOPMENT" },
  { category: "external_impact", label: "EXTERNAL IMPACT" },
];

function formatYear(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.getFullYear().toString();
}

function getDetailLine(a: Achievement): string {
  const parts: string[] = [];
  switch (a.category) {
    case "publication":
      if (a.co_authors?.length) parts.push(`Authors: ${a.co_authors.join(", ")}`);
      if (a.venue) parts.push(a.venue);
      if (a.journal_name) parts.push(a.journal_name);
      if (formatYear(a.date)) parts.push(formatYear(a.date));
      if (a.impact_factor) parts.push(`IF: ${a.impact_factor}`);
      if (a.status && a.status !== "published") parts.push(`[${a.status}]`);
      const doi = a.tags?.find((t) => t.startsWith("doi:"))?.replace("doi:", "DOI: ");
      if (doi) parts.push(doi);
      break;
    case "research_presentation":
    case "invited_talk":
      if (a.venue) parts.push(a.venue);
      if (a.organization) parts.push(a.organization);
      if (formatYear(a.date)) parts.push(formatYear(a.date));
      break;
    case "course_taught":
      if (a.course_code) parts.push(a.course_code);
      if (a.term) parts.push(a.term);
      if (a.student_count) parts.push(`Students: ${a.student_count}`);
      if (formatYear(a.date)) parts.push(formatYear(a.date));
      break;
    case "award_honor":
      if (a.award_type) parts.push(a.award_type);
      if (a.organization) parts.push(a.organization);
      if (formatYear(a.date)) parts.push(formatYear(a.date));
      break;
    case "student_supervision": {
      if (a.student_name) parts.push(a.student_name);
      const levels: Record<string, string> = { undergraduate: "Undergraduate", masters: "Master's", phd: "PhD", postdoc: "Postdoc" };
      if (a.student_level) parts.push(levels[a.student_level] ?? a.student_level);
      if (formatYear(a.date)) parts.push(formatYear(a.date));
      break;
    }
    case "teaching_performance":
      if (a.term) parts.push(a.term);
      if (a.evaluation_score != null) parts.push(`Score: ${a.evaluation_score}`);
      if (formatYear(a.date)) parts.push(formatYear(a.date));
      break;
    default:
      if (a.organization) parts.push(a.organization);
      if (a.venue) parts.push(a.venue);
      if (formatYear(a.date)) parts.push(formatYear(a.date));
  }
  return parts.filter(Boolean).join("  |  ");
}

function sortByDateDesc(items: Achievement[]): Achievement[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

export interface PdfExportOptions {
  userName?: string;
  includeDescription?: boolean;
}

export async function exportAchievementsToPdf(
  achievements: Achievement[],
  options: PdfExportOptions = {}
): Promise<void> {
  const { userName, includeDescription = true } = options;

  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const marginLeft = 54;      // 0.75 in
  const marginRight = 54;
  const marginTop = 54;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = marginTop;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - marginTop) {
      doc.addPage();
      y = marginTop;
    }
  };

  // Helper: wrapped text block - returns new y
  const writeWrapped = (
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number
  ): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, startY);
    return startY + lines.length * lineHeight;
  };

  // ── Title ──────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const title = userName ?? "Academic Portfolio";
  const titleW = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleW) / 2, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  const sub = "Scholastic Achievements";
  const subW = doc.getTextWidth(sub);
  doc.text(sub, (pageWidth - subW) / 2, y);
  y += 28;
  doc.setTextColor(0);

  // ── Sections ──────────────────────────────────────
  for (const { category, label } of SECTION_ORDER) {
    const items = sortByDateDesc(achievements.filter((a) => a.category === category));
    if (items.length === 0) continue;

    checkPage(36);

    // Section header line
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(label, marginLeft, y);
    y += 4;
    doc.setDrawColor(40);
    doc.setLineWidth(0.75);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 10;

    for (const item of items) {
      checkPage(40);

      // Entry title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(0);
      y = writeWrapped(item.title, marginLeft, y, contentWidth, 14);
      y += 2;

      // Detail line
      const detail = getDetailLine(item);
      if (detail) {
        checkPage(16);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(80);
        y = writeWrapped(detail, marginLeft, y, contentWidth, 13);
        y += 2;
      }

      // Description
      if (includeDescription && item.description) {
        checkPage(16);
        doc.setFont("helvetica", "oblique");
        doc.setFontSize(9);
        doc.setTextColor(100);
        y = writeWrapped(item.description, marginLeft, y, contentWidth, 12);
      }

      doc.setTextColor(0);
      y += 8;
    }

    y += 4;
  }

  // ── Page numbers ──────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    const pageLabel = `${i} / ${totalPages}`;
    const pw = doc.getTextWidth(pageLabel);
    doc.text(pageLabel, (pageWidth - pw) / 2, pageHeight - 30);
  }

  const filename = `${(userName ?? "academic-achievements").toLowerCase().replace(/\s+/g, "-")}-resume.pdf`;
  doc.save(filename);
}
