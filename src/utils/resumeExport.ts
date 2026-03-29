import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  UnderlineType,
} from "docx";
import { Achievement } from "@/types/achievements";

type SectionCategory = Achievement["category"];

const SECTION_ORDER: { category: SectionCategory; label: string }[] = [
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

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.getFullYear().toString();
}

function buildPublicationLines(a: Achievement): string[] {
  const parts: string[] = [];
  if (a.co_authors?.length) parts.push(`Authors: ${a.co_authors.join(", ")}`);
  if (a.venue) parts.push(a.venue);
  if (a.journal_name) parts.push(a.journal_name);
  const year = formatDate(a.date);
  if (year) parts.push(year);
  if (a.impact_factor) parts.push(`Impact Factor: ${a.impact_factor}`);
  if (a.status && a.status !== "published") parts.push(`Status: ${a.status}`);
  const doi = a.tags?.find((t) => t.startsWith("doi:"))?.replace("doi:", "DOI: ");
  if (doi) parts.push(doi);
  if (a.url) parts.push(`URL: ${a.url}`);
  return parts;
}

function buildPresentationLines(a: Achievement): string[] {
  const parts: string[] = [];
  if (a.venue) parts.push(a.venue);
  if (a.organization) parts.push(a.organization);
  const year = formatDate(a.date);
  if (year) parts.push(year);
  return parts;
}

function buildCourseLine(a: Achievement): string[] {
  const parts: string[] = [];
  if (a.course_code) parts.push(a.course_code);
  if (a.term) parts.push(a.term);
  if (a.student_count) parts.push(`Students: ${a.student_count}`);
  const year = formatDate(a.date);
  if (year) parts.push(year);
  return parts;
}

function buildAwardLine(a: Achievement): string[] {
  const parts: string[] = [];
  if (a.award_type) parts.push(a.award_type);
  if (a.organization) parts.push(a.organization);
  const year = formatDate(a.date);
  if (year) parts.push(year);
  return parts;
}

function buildSupervisionLine(a: Achievement): string[] {
  const parts: string[] = [];
  if (a.student_name) parts.push(a.student_name);
  if (a.student_level) {
    const levels: Record<string, string> = {
      undergraduate: "Undergraduate",
      masters: "Master's",
      phd: "PhD",
      postdoc: "Postdoc",
    };
    parts.push(levels[a.student_level] ?? a.student_level);
  }
  const year = formatDate(a.date);
  if (year) parts.push(year);
  return parts;
}

function buildTeachingLine(a: Achievement): string[] {
  const parts: string[] = [];
  if (a.term) parts.push(a.term);
  if (a.evaluation_score != null) parts.push(`Evaluation Score: ${a.evaluation_score}`);
  const year = formatDate(a.date);
  if (year) parts.push(year);
  return parts;
}

function buildGenericLine(a: Achievement): string[] {
  const parts: string[] = [];
  if (a.organization) parts.push(a.organization);
  if (a.venue) parts.push(a.venue);
  const year = formatDate(a.date);
  if (year) parts.push(year);
  return parts;
}

function getDetailLine(a: Achievement): string {
  let parts: string[] = [];
  switch (a.category) {
    case "publication":
      parts = buildPublicationLines(a);
      break;
    case "research_presentation":
    case "invited_talk":
      parts = buildPresentationLines(a);
      break;
    case "course_taught":
      parts = buildCourseLine(a);
      break;
    case "award_honor":
      parts = buildAwardLine(a);
      break;
    case "student_supervision":
      parts = buildSupervisionLine(a);
      break;
    case "teaching_performance":
      parts = buildTeachingLine(a);
      break;
    default:
      parts = buildGenericLine(a);
  }
  return parts.filter(Boolean).join(" | ");
}

function sortByDateDesc(items: Achievement[]): Achievement[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

function makeSectionHeader(label: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: label,
        bold: true,
        size: 24, // 12pt
        font: "Calibri",
        allCaps: true,
      }),
    ],
    spacing: { before: 320, after: 80 },
    border: {
      bottom: {
        color: "000000",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    alignment: AlignmentType.LEFT,
  });
}

function makeEntryTitle(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 22, // 11pt
        font: "Calibri",
      }),
    ],
    spacing: { before: 120, after: 40 },
    alignment: AlignmentType.LEFT,
  });
}

function makeDetailLine(detail: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: detail,
        size: 20, // 10pt
        font: "Calibri",
        color: "444444",
      }),
    ],
    spacing: { before: 0, after: 40 },
    alignment: AlignmentType.LEFT,
  });
}

function makeDescriptionLine(description: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: description,
        size: 20,
        font: "Calibri",
        italics: true,
        color: "555555",
      }),
    ],
    spacing: { before: 0, after: 60 },
    alignment: AlignmentType.LEFT,
  });
}

export interface ResumeExportOptions {
  userName?: string;
  includeDescription?: boolean;
}

export async function exportAchievementsToDocx(
  achievements: Achievement[],
  options: ResumeExportOptions = {}
): Promise<void> {
  const { userName, includeDescription = true } = options;

  const docChildren: Paragraph[] = [];

  // Document title
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: userName ?? "Academic Portfolio",
          bold: true,
          size: 32, // 16pt
          font: "Calibri",
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
      spacing: { after: 120 },
      alignment: AlignmentType.CENTER,
    })
  );

  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Scholastic Achievements",
          size: 24,
          font: "Calibri",
          color: "555555",
        }),
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER,
    })
  );

  // Build each section
  for (const { category, label } of SECTION_ORDER) {
    const items = sortByDateDesc(
      achievements.filter((a) => a.category === category)
    );
    if (items.length === 0) continue;

    docChildren.push(makeSectionHeader(label));

    for (const item of items) {
      docChildren.push(makeEntryTitle(item.title));

      const detail = getDetailLine(item);
      if (detail) docChildren.push(makeDetailLine(detail));

      if (includeDescription && item.description) {
        docChildren.push(makeDescriptionLine(item.description));
      }
    }
  }

  const doc = new Document({
    creator: "Academe Vision Board",
    title: `${userName ?? "Academic"} – Scholastic Achievements`,
    description: "ATS-scannable academic resume export",
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080,    // 0.75 inch
              bottom: 1080,
              left: 1080,
              right: 1080,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(userName ?? "academic-achievements").toLowerCase().replace(/\s+/g, "-")}-resume.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
