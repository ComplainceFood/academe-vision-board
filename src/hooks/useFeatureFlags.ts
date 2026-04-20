/**
 * useFeatureFlags
 *
 * Source of truth for feature-flag state.
 *
 * Flags are stored in the `feature_flags` Supabase table (previously localStorage),
 * so admin toggles propagate to ALL users in real-time via a postgres_changes listener.
 *
 * canUse(key) returns true when ANY of the following:
 *   1. The current user is a system_admin
 *   2. The flag is globally enabled in the DB (admin promo override)
 *   3. The user's subscription tier meets the feature's minTier requirement
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { useSubscription } from "./useSubscription";
import { useAuth } from "./useAuth";

// "enterprise" is reserved for future use - not yet offered publicly
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

// ── Promo flag key (exported for use in UI components) ────────────────────────
export const PROMO_FLAG_KEY = "pro_free_promo";

// Canonical list of gated features.
// minTier = 'free' means everyone can use it.
// minTier = 'pro'  means Pro + Enterprise only (unless globally enabled by admin).
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

// Build a default map (all false) for flags not yet in the DB
function buildDefaults(): Record<string, boolean> {
  return Object.fromEntries(FEATURE_DEFINITIONS.map((f) => [f.key, false]));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseFeatureFlagsReturn {
  /** globallyEnabled map keyed by feature key */
  flags: Record<string, boolean>;
  userTier: SubscriptionTier;
  /** Returns true if the current user may use this feature */
  canUse: (key: string) => boolean;
  /** Admin: toggle a feature's globallyEnabled state in the DB */
  toggleFlag: (key: string, enabled: boolean) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { user } = useAuth();
  const { isSystemAdmin } = useUserRole();
  const { subscription, loading: subLoading } = useSubscription();

  const [flags, setFlags] = useState<Record<string, boolean>>(buildDefaults);
  const [flagsLoading, setFlagsLoading] = useState(true);

  const userTier = subscription.tier;
  const loading = subLoading || flagsLoading;

  // ── Fetch all flags from Supabase ────────────────────────────────────────
  const fetchFlags = useCallback(async () => {
    setFlagsLoading(true);
    try {
      const { data, error } = await supabase
        .from("feature_flags" as any)
        .select("key, enabled");

      if (error) {
        console.error("useFeatureFlags fetch error:", error);
        return;
      }

      const map = { ...buildDefaults() };
      if (data) {
        for (const row of data as { key: string; enabled: boolean }[]) {
          map[row.key] = row.enabled;
        }
      }
      setFlags(map);
    } finally {
      setFlagsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchFlags();
  }, [user, fetchFlags]);

  // ── Realtime subscription - updates ALL users when admin changes a flag ──
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("feature-flags-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature_flags" },
        () => {
          fetchFlags();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchFlags]);

  const refresh = useCallback(async () => {
    await fetchFlags();
  }, [fetchFlags]);

  // ── canUse ───────────────────────────────────────────────────────────────
  const canUse = useCallback(
    (key: string): boolean => {
      // System admins always have access to everything
      if (isSystemAdmin()) return true;

      const def = FEATURE_DEFINITIONS.find((f) => f.key === key);
      if (!def) return false; // unknown key - deny by default (unknown features are not accessible)

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

  // ── toggleFlag ───────────────────────────────────────────────────────────
  // Writes to Supabase via SECURITY DEFINER RPC. The realtime listener above
  // will then update flags for ALL connected sessions automatically.
  const toggleFlag = useCallback(
    async (key: string, enabled: boolean) => {
      const { data, error } = await supabase.rpc("admin_set_feature_flag" as any, {
        p_key: key,
        p_enabled: enabled,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || "Failed to update feature flag");
      }

      // Optimistic local update (realtime will also confirm this)
      setFlags((prev) => ({ ...prev, [key]: enabled }));
    },
    []
  );

  return { flags, userTier, canUse, toggleFlag, loading, refresh };
}

// ── usePromoMode ──────────────────────────────────────────────────────────────
// Reads the pro_free_promo flag using the anon key so it works on the public
// landing page without requiring the user to be logged in.
export function usePromoMode(): { promoActive: boolean; loading: boolean } {
  const [promoActive, setPromoActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("feature_flags" as any)
      .select("enabled")
      .eq("key", PROMO_FLAG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        setPromoActive((data as any)?.enabled ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Realtime: update instantly when admin toggles the flag
    const channel = supabase
      .channel("promo-flag-public")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "feature_flags", filter: `key=eq.${PROMO_FLAG_KEY}` },
        (payload) => setPromoActive((payload.new as any).enabled ?? false)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { promoActive, loading };
}
