/**
 * PageGuide — a dismissable contextual help banner shown at the top of each module page.
 * Dismissed state is stored in localStorage per page so it only shows once.
 *
 * Usage:
 *   <PageGuide page="notes" />
 */
import { useState } from "react";
import { X, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageKey =
  | "notes"
  | "meetings"
  | "planning"
  | "funding"
  | "supplies"
  | "achievements"
  | "analytics"
  | "communications"
  | "feedback"
  | "settings";

interface FieldHint {
  field: string;
  hint: string;
  example?: string;
  optional?: boolean;
}

interface PageGuideConfig {
  title: string;
  summary: string;
  fields: FieldHint[];
  tip?: string;
}

const GUIDES: Record<PageKey, PageGuideConfig> = {
  notes: {
    title: "Notes & Commitments — What to fill in",
    summary:
      "Use this module to capture student commitments, verbal promises, and any notes you want to track across the semester.",
    fields: [
      { field: "Title", hint: "A short label for the note or commitment", example: "e.g. 'Extra credit deadline extension for Alex'" },
      { field: "Type", hint: "Choose Note (general) or Commitment (a student promise or agreement you need to follow up on)" },
      { field: "Priority", hint: "High if it affects grades or deadlines; Low for general reminders", optional: true },
      { field: "Due Date", hint: "When the commitment or note should be acted on or reviewed", optional: true },
      { field: "Course", hint: "Link this note to a specific course so you can filter by class", optional: true },
      { field: "Tags / Folder", hint: "Organise notes into folders (e.g. COMP101, Advising) for quick retrieval", optional: true },
    ],
    tip: "Commitments turn yellow when overdue and are tracked on your Dashboard. Start by logging any verbal agreements made with students.",
  },
  meetings: {
    title: "Meetings — What to fill in",
    summary:
      "Schedule and track all types of meetings — 1:1 student sessions, faculty meetings, advising appointments, and research team check-ins.",
    fields: [
      { field: "Title", hint: "Descriptive name for the meeting", example: "e.g. 'Thesis progress review — Sarah'" },
      { field: "Type", hint: "One-on-one for individual sessions; Group for committees or team meetings" },
      { field: "Date & Time", hint: "When the meeting starts and ends" },
      { field: "Location", hint: "Room number, Zoom link, or 'TBD'", optional: true },
      { field: "Attendees", hint: "Add names and emails of attendees for record-keeping and future reference", optional: true },
      { field: "Agenda", hint: "A brief list of topics to cover — helps you stay on track and review after", optional: true },
      { field: "Action Items", hint: "Tasks that come out of the meeting — assigned to you or attendees", optional: true },
      { field: "Reminder", hint: "Get notified X minutes before the meeting starts", optional: true },
    ],
    tip: "Use Quick Add at the top to create a meeting in seconds, then fill in more details later.",
  },
  planning: {
    title: "Semester Planning — What to fill in",
    summary:
      "Your academic calendar. Add events (lectures, exams, deadlines) and plan future semester tasks. The AI Planner can parse plain-language descriptions.",
    fields: [
      { field: "AI Smart Planner", hint: "Type something like 'Midterm grading due next Friday' — AI fills in the form for you" },
      { field: "Event Title", hint: "What the event is", example: "e.g. 'COMP301 Midterm Exam'" },
      { field: "Type", hint: "Task (to-do), Deadline (hard cutoff), Event (class/meeting), or Goal (longer-term target)" },
      { field: "Date & Time", hint: "When it happens or is due" },
      { field: "Priority", hint: "High for anything affecting grades or grant deadlines", optional: true },
      { field: "Course", hint: "Which course this relates to", optional: true },
      { field: "Future Tasks", hint: "Use the Future Planning tab to add goals for upcoming semesters — these don't show on the calendar but track your longer-term plans", optional: true },
    ],
    tip: "Your Semester Focus Plan (below the calendar) adapts to your role — set your Position in Settings to get personalised priorities.",
  },
  funding: {
    title: "Grant Management — What to fill in",
    summary:
      "Track every grant, funding source, and expenditure. Use AI Narrative to generate progress reports automatically.",
    fields: [
      { field: "Grant Name", hint: "Full name of the funding source", example: "e.g. 'NSF CAREER Award 2024'" },
      { field: "Type", hint: "Federal, State, Industry, Internal, Foundation, etc." },
      { field: "Total Amount", hint: "The total award value in dollars" },
      { field: "Start / End Date", hint: "Grant period — used to calculate how much budget remains" },
      { field: "Status", hint: "Active, Pending, Completed, or Expired" },
      { field: "Description", hint: "Brief summary of the grant purpose — used by AI Narrative to generate reports", optional: true },
      { field: "Expenditures", hint: "Log each expense against a grant: amount, category (Personnel, Equipment, Travel, etc.), and date", optional: true },
      { field: "Grant Meetings", hint: "Link meeting records to a grant for traceability", optional: true },
    ],
    tip: "Once you have at least one grant and a few expenses, the AI Narrative tab can draft a progress report for you.",
  },
  supplies: {
    title: "Supplies & Expenses — What to fill in",
    summary:
      "Monitor lab or classroom inventory levels and log course-related spending. Alerts you when stock drops below your threshold.",
    fields: [
      { field: "Item Name", hint: "What the supply is", example: "e.g. 'Pipette tips 200µL'" },
      { field: "Category", hint: "Lab Supplies, Office, Equipment, Chemicals, etc." },
      { field: "Current Count", hint: "How many units you have right now" },
      { field: "Total Count", hint: "Maximum storage capacity or original purchase quantity" },
      { field: "Threshold", hint: "The minimum count before a low-stock alert fires on your Dashboard" },
      { field: "Expenses", hint: "Log purchases separately in the Expenses tab: amount, date, category, and which course it relates to", optional: true },
      { field: "Receipt", hint: "Upload a receipt image for expense record-keeping and reimbursement", optional: true },
    ],
    tip: "Use CSV Import to bulk-upload your existing inventory list in one go.",
  },
  achievements: {
    title: "Scholastic Achievements — What to fill in",
    summary:
      "Record publications, awards, conference presentations, grants received, and any milestone you want to track for tenure or annual review.",
    fields: [
      { field: "Title", hint: "Name of the achievement, paper, or award", example: "e.g. 'Best Paper Award — ICML 2024'" },
      { field: "Type", hint: "Publication, Award, Conference, Grant, Teaching Excellence, Service, etc." },
      { field: "Date", hint: "When it happened or was published" },
      { field: "Description", hint: "Additional context, abstract snippet, or citation", optional: true },
      { field: "URL / DOI", hint: "Link to the paper, award page, or conference proceedings", optional: true },
    ],
    tip: "Keeping this up to date makes generating your annual report or promotion dossier much faster.",
  },
  analytics: {
    title: "Analytics — How to read your data",
    summary:
      "Visual summaries of everything happening across your modules — activity trends, expense breakdowns, and AI-generated insights.",
    fields: [
      { field: "Time Range", hint: "Switch between 7, 30, or 90 days to see short-term vs. longer patterns" },
      { field: "Overview tab", hint: "Total counts across notes, meetings, expenses, and funding" },
      { field: "Trends tab", hint: "Line charts showing daily activity — useful for spotting overloaded weeks" },
      { field: "Distribution tab", hint: "Pie and bar charts breaking down where your time and money go" },
      { field: "AI Insights tab", hint: "Personalised recommendations generated from your data patterns" },
    ],
    tip: "Analytics data is most useful after 2–3 weeks of active use. The more you log, the better the insights.",
  },
  communications: {
    title: "Communications — What this module is for",
    summary:
      "Platform-wide announcements from administrators. You can read messages sent to all users or to your role group.",
    fields: [
      { field: "Announcements tab", hint: "Messages broadcast to all platform users by admins" },
      { field: "Direct Messages tab", hint: "Messages sent specifically to your account" },
      { field: "Admin view", hint: "If you are a system admin, you can compose and send announcements here", optional: true },
    ],
    tip: "Check here for platform updates, policy changes, or semester-start reminders from your institution.",
  },
  feedback: {
    title: "Platform Feedback — How to use this",
    summary:
      "Share suggestions, report bugs, or rate features. Your feedback directly shapes future Smart‑Prof improvements.",
    fields: [
      { field: "Title", hint: "Short description of the feedback", example: "e.g. 'Add export to PDF for grant reports'" },
      { field: "Category", hint: "Bug, Feature Request, Improvement, or General" },
      { field: "Priority", hint: "How urgently you need this addressed", optional: true },
      { field: "Description", hint: "Full details — steps to reproduce a bug, or what problem a feature would solve" },
    ],
    tip: "Bugs with clear steps to reproduce get fixed fastest. Feature requests with a use-case explanation are more likely to be prioritised.",
  },
  settings: {
    title: "Settings — Profile fields explained",
    summary:
      "Personalising your profile improves how the platform contextualises your data and tailors features to your role.",
    fields: [
      { field: "Display Name", hint: "How your name appears in the sidebar and across the platform", example: "e.g. 'Dr. Johnson'" },
      { field: "Position", hint: "Your academic role — drives the Semester Focus Plan and contextual guidance", example: "e.g. 'Associate Professor', 'Research Scientist'" },
      { field: "Department", hint: "Your department or school", example: "e.g. 'Computer Science', 'School of Education'" },
      { field: "Office Location", hint: "Shown on meeting records and useful for attendees", example: "e.g. 'Science Hall, Room 204'", optional: true },
      { field: "ORCID ID", hint: "Your Open Researcher and Contributor ID — links your achievements to your academic identity", optional: true },
      { field: "Bio", hint: "A short paragraph about your research interests or teaching focus", optional: true },
    ],
    tip: "Position is the single most impactful field — set it to unlock role-tailored priorities and guidance throughout the app.",
  },
};

function dismissKey(page: PageKey) {
  return `smartprof_guide_dismissed_${page}`;
}

interface PageGuideProps {
  page: PageKey;
}

export function PageGuide({ page }: PageGuideProps) {
  const key = dismissKey(page);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(key));
  const [expanded, setExpanded] = useState(false);

  const dismiss = () => {
    localStorage.setItem(key, "1");
    setDismissed(true);
  };

  if (dismissed) {
    // Show a small "?" restore button
    return (
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem(key);
          setDismissed(false);
          setExpanded(true);
        }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
        title="Show page guide"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Show guide
      </button>
    );
  }

  const guide = GUIDES[page];

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/8 mb-4 overflow-hidden">
      {/* Header row — always visible */}
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary leading-tight">{guide.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{guide.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/60"
            title={expanded ? "Collapse" : "Expand field guide"}
          >
            {expanded
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/60"
            title="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable field hints */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {guide.fields.map(({ field, hint, example, optional }) => (
              <div key={field} className="rounded-xl bg-background/70 border border-border/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-semibold text-foreground">{field}</span>
                  {optional && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-normal text-muted-foreground">
                      optional
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>
                {example && (
                  <p className="text-[10px] text-primary/70 mt-0.5 italic">{example}</p>
                )}
              </div>
            ))}
          </div>

          {guide.tip && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
              <span className="text-amber-500 text-sm shrink-0">💡</span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                <strong>Pro tip:</strong> {guide.tip}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={dismiss} className="text-xs text-muted-foreground h-7">
              Got it — don't show again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
