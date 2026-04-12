import { useState, useEffect, useCallback } from "react";
import { useUserRole } from "./useUserRole";
import { useSubscription } from "./useSubscription";

// "enterprise" is reserved for future use — not yet offered publicly
export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  module: string;
  /** Minimum tier required to use this feature */
  minTier: SubscriptionTier;
  /** Admin can force-enable for ALL users regardless of tier */
  globallyEnabled: boolean;
}

// Canonical list of gated features.
// minTier = 'free' means everyone can use it (no gate needed, but listed for completeness).
// minTier = 'pro' means Pro + Enterprise only.
export const FEATURE_DEFINITIONS: Omit<FeatureFlag, "globallyEnabled">[] = [
  // ── Achievements ──────────────────────────────────────────────
  {
    key: "achievements_cv_import",
    label: "CV Import (AI)",
    description: "Upload a PDF CV and auto-extract achievements using AI",
    module: "Achievements",
    minTier: "pro",
  },
  {
    key: "achievements_resume_export",
    label: "Resume / CV Export",
    description: "Export achievements to formatted DOCX or PDF",
    module: "Achievements",
    minTier: "pro",
  },
  {
    key: "achievements_biosketch",
    label: "Biosketch Generator (AI)",
    description: "Generate NIH/NSF biosketches from your achievements",
    module: "Achievements",
    minTier: "pro",
  },
  {
    key: "achievements_orcid",
    label: "ORCID Integration",
    description: "Link ORCID ID and auto-import publications",
    module: "Achievements",
    minTier: "pro",
  },
  {
    key: "achievements_citation_metrics",
    label: "Citation Metrics",
    description: "Live h-index and citation counts via OpenAlex",
    module: "Achievements",
    minTier: "pro",
  },
  // ── Analytics ─────────────────────────────────────────────────
  {
    key: "analytics_ai_insights",
    label: "AI Analytics Insights",
    description: "Gemini AI-powered personalised productivity insights",
    module: "Analytics",
    minTier: "pro",
  },
  // ── Planning ──────────────────────────────────────────────────
  {
    key: "planning_outlook_sync",
    label: "Outlook Calendar Sync",
    description: "Sync events with Microsoft Outlook calendar",
    module: "Planning",
    minTier: "pro",
  },
  {
    key: "planning_google_sync",
    label: "Google Calendar Sync",
    description: "Sync events with Google Calendar",
    module: "Planning",
    minTier: "pro",
  },
  {
    key: "planning_ai_event",
    label: "AI Event Planner",
    description: "AI-generated event details and scheduling suggestions",
    module: "Planning",
    minTier: "pro",
  },
  // ── Funding ───────────────────────────────────────────────────
  {
    key: "funding_ai_narrative",
    label: "AI Grant Narrative Writer",
    description: "Generate progress reports and budget justifications with AI",
    module: "Funding",
    minTier: "pro",
  },
  // ── Meetings ──────────────────────────────────────────────────
  {
    key: "meetings_ai_agenda",
    label: "AI Meeting Agenda",
    description: "Auto-generate structured meeting agendas",
    module: "Meetings",
    minTier: "pro",
  },
  {
    key: "meetings_ai_summary",
    label: "AI Meeting Summarizer",
    description: "Summarise meetings and extract action items with AI",
    module: "Meetings",
    minTier: "pro",
  },
  // ── Notes / Tasks ─────────────────────────────────────────────
  {
    key: "notes_ai_draft",
    label: "AI Task Draft",
    description: "Polish rough task descriptions into structured tasks with AI",
    module: "Notes & Tasks",
    minTier: "pro",
  },
  // ── Supplies ──────────────────────────────────────────────────
  {
    key: "supplies_ai_analysis",
    label: "AI Supply Analysis",
    description: "AI-powered reorder recommendations and threshold adjustments",
    module: "Supplies",
    minTier: "pro",
  },
  // ── Data ──────────────────────────────────────────────────────
  {
    key: "data_export_import",
    label: "Advanced Data Export / Import",
    description: "Export all modules to JSON, CSV, or XLSX; restore from backup",
    module: "Data",
    minTier: "pro",
  },
];

// Local-storage key used as an offline cache / fallback for the admin settings
const LS_KEY = "smartprof_feature_flags";

// Default globallyEnabled state (all false = honour tier restrictions)
function buildDefaults(): Record<string, boolean> {
  return Object.fromEntries(FEATURE_DEFINITIONS.map((f) => [f.key, false]));
}

function loadFromLocalStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...buildDefaults(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return buildDefaults();
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseFeatureFlagsReturn {
  flags: Record<string, boolean>; // globallyEnabled map
  userTier: SubscriptionTier;
  /** Returns true if the current user may use this feature */
  canUse: (key: string) => boolean;
  /** Admin: toggle a feature's globallyEnabled state */
  toggleFlag: (key: string, enabled: boolean) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { isSystemAdmin } = useUserRole();
  // Delegate all tier/subscription logic to useSubscription (single source of truth).
  // When Stripe is integrated the same hook reflects updates in real-time via postgres_changes.
  const { subscription, loading: subLoading } = useSubscription();
  const [flags, setFlags] = useState<Record<string, boolean>>(loadFromLocalStorage);

  const userTier = subscription.tier;
  const loading = subLoading;

  // Keep flags in sync with localStorage (written by admin UI)
  useEffect(() => {
    setFlags(loadFromLocalStorage());
  }, []);

  const refresh = useCallback(async () => {
    setFlags(loadFromLocalStorage());
  }, []);

  const canUse = useCallback(
    (key: string): boolean => {
      // System admins always have access to everything
      if (isSystemAdmin()) return true;

      const def = FEATURE_DEFINITIONS.find((f) => f.key === key);
      if (!def) return true; // unknown key — allow by default

      // Feature is force-enabled for everyone by admin override
      if (flags[key] === true) return true;

      // Check tier hierarchy
      const TIER_ORDER: SubscriptionTier[] = ["free", "pro", "enterprise"];
      const userLevel = TIER_ORDER.indexOf(userTier);
      const requiredLevel = TIER_ORDER.indexOf(def.minTier);
      return userLevel >= requiredLevel;
    },
    [flags, userTier, isSystemAdmin]
  );

  const toggleFlag = useCallback(
    async (key: string, enabled: boolean) => {
      const updated = { ...flags, [key]: enabled };
      setFlags(updated);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    },
    [flags]
  );

  return { flags, userTier, canUse, toggleFlag, loading, refresh };
}
