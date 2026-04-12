import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookText,
  Calendar,
  DollarSign,
  ClipboardList,
  BarChart3,
  Award,
  MessageSquare,
  Settings,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  UserCircle,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { SmartProfLogo } from "@/components/Logo";
import { Link } from "react-router-dom";

const ONBOARDING_KEY = "smartprof_onboarding_done";

interface Step {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const MODULE_CARDS = [
  {
    icon: BookText,
    label: "Notes & Commitments",
    desc: "Log student promises, deadlines, and class notes",
    color: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    icon: MessageSquare,
    label: "Meetings",
    desc: "Schedule 1:1s, group sessions, and office hours",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  },
  {
    icon: Calendar,
    label: "Semester Planning",
    desc: "Map out events, tasks, and deadlines by semester",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  {
    icon: DollarSign,
    label: "Grant Management",
    desc: "Track funding sources and record expenditures",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    icon: ClipboardList,
    label: "Supplies & Expenses",
    desc: "Monitor lab inventory and course-related spending",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  },
  {
    icon: Award,
    label: "Achievements",
    desc: "Record publications, awards, and milestones",
    color: "bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
  },
];

const PROFILE_TIPS = [
  { field: "Position", example: "e.g. Associate Professor, Research Scientist", why: "Personalises your Semester Focus Plan" },
  { field: "Department", example: "e.g. Computer Science, Biology", why: "Helps contextualise your data" },
  { field: "Office Location", example: "e.g. Sci Hall 204", why: "Displayed on meeting invites" },
  { field: "Bio", example: "Short blurb about your research or teaching area", why: "Visible to students and collaborators" },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(() => !localStorage.getItem(ONBOARDING_KEY));
  const [step, setStep] = useState(0);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOpen(false);
  };

  const steps: Step[] = [
    {
      title: "Welcome to Smart‑Prof",
      subtitle: "Your all-in-one academic management platform",
      content: (
        <div className="space-y-5">
          <div className="flex justify-center">
            <div className="flex items-center gap-3 bg-primary/8 rounded-2xl px-5 py-4 border border-primary/15">
              <SmartProfLogo size={44} />
              <div>
                <p className="text-base font-bold">Smart<span className="text-primary">-Prof</span></p>
                <p className="text-xs text-muted-foreground">Teaching Smarter</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Smart‑Prof is designed specifically for university professors - whether you focus
            on teaching, research, or both. This short guide (4 steps) will help you understand
            what each part of the platform does and what information to fill in.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: LayoutDashboard, label: "Unified Dashboard", desc: "Everything at a glance" },
              { icon: Sparkles, label: "AI-Powered", desc: "Insights and narratives" },
              { icon: Calendar, label: "Semester Aware", desc: "Plans adapt to your schedule" },
              { icon: CheckCircle2, label: "Role Adaptive", desc: "Tailored to teaching or research" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3">
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Set Up Your Profile",
      subtitle: "A few fields make the platform feel like yours",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Head to <strong>Settings → Profile</strong> after this tour. Here's what each field does:
          </p>
          <div className="space-y-2">
            {PROFILE_TIPS.map(({ field, example, why }) => (
              <div key={field} className="rounded-xl border bg-card p-3 flex gap-3 items-start">
                <UserCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{field}</span>
                    <span className="text-[10px] text-muted-foreground italic">{example}</span>
                  </div>
                  <p className="text-[11px] text-primary/80 mt-0.5">↳ {why}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex gap-2.5 items-start">
            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Tip:</strong> Setting your <em>Position</em> (e.g. "Research Professor") automatically
              tailors your Semester Focus Plan with relevant priorities.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Your Key Modules",
      subtitle: "Six areas that cover your full academic workflow",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Each module is independent - use what fits your workflow. Nothing is mandatory.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODULE_CARDS.map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <div className={`p-1.5 rounded-lg shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            You can always revisit this guide from the <strong>?</strong> icon on any page.
          </p>
        </div>
      ),
    },
    {
      title: "You're Ready to Go",
      subtitle: "A few quick tips to get the most out of Smart‑Prof",
      content: (
        <div className="space-y-4">
          <div className="space-y-2.5">
            {[
              {
                icon: BarChart3,
                tip: "Start with the Dashboard",
                detail: "All your key numbers are summarised there. Stat cards link directly to each module.",
              },
              {
                icon: Calendar,
                tip: "Add your first Planning Event",
                detail: "Go to Semester Planning and type a task or deadline in the AI Smart Planner - it parses plain language.",
              },
              {
                icon: DollarSign,
                tip: "Log a Grant or Expense",
                detail: "Even one entry in Grant Management unlocks the Overview charts and AI narrative reports.",
              },
              {
                icon: Settings,
                tip: "Complete your profile",
                detail: "Position and Department unlock personalised guidance across the entire app.",
              },
            ].map(({ icon: Icon, tip, detail }, i) => (
              <div key={i} className="flex gap-3 items-start rounded-xl bg-muted/40 p-3">
                <div className="bg-primary/10 rounded-lg p-1.5 shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{tip}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-primary/8 border border-primary/15 p-3 flex gap-2.5 items-center">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs text-primary font-medium">
              Need help later? Look for the <ChevronRight className="inline h-3 w-3" /> guide icon on any page.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-secondary px-6 pt-6 pb-5 text-primary-foreground">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-white/20 text-white border-0 text-[10px] font-medium">
              Step {step + 1} of {steps.length}
            </Badge>
            <button
              type="button"
              onClick={dismiss}
              className="text-white/60 hover:text-white text-xs transition-colors"
            >
              Skip tour
            </button>
          </div>
          <h2 className="text-lg font-bold leading-tight">{current.title}</h2>
          <p className="text-primary-foreground/75 text-sm mt-1">{current.subtitle}</p>
          <Progress value={progress} className="mt-4 h-1 bg-white/20 [&>div]:bg-white" />
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0"
          >
            ← Back
          </button>
          {isLast ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild onClick={dismiss}>
                <Link to="/settings">
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Go to Settings
                </Link>
              </Button>
              <Button size="sm" onClick={dismiss}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Get Started
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setStep(s => s + 1)}>
              Next
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Utility - call this to reset the onboarding (e.g. from a Help button) */
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
