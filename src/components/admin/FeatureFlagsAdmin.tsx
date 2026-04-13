import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sparkles, Lock, Unlock, RotateCcw, Save, Info, Globe } from "lucide-react";
import { FEATURE_DEFINITIONS, useFeatureFlags, type SubscriptionTier } from "@/hooks/useFeatureFlags";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: "bg-slate-100 text-slate-700 border-slate-200",
  pro: "bg-amber-50 text-amber-700 border-amber-200",
  enterprise: "bg-purple-50 text-purple-700 border-purple-200",
};

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function FeatureFlagsAdmin() {
  const { flags, toggleFlag, loading } = useFeatureFlags();
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync local copy whenever the DB-backed flags update (e.g. from another session)
  // Only reset local edits when not currently dirty to avoid clobbering pending changes.
  useEffect(() => {
    if (!dirty) {
      setLocalFlags({ ...flags });
    }
  }, [flags, dirty]);

  // Group features by module
  const grouped = FEATURE_DEFINITIONS.reduce<Record<string, typeof FEATURE_DEFINITIONS>>((acc, f) => {
    if (!acc[f.module]) acc[f.module] = [];
    acc[f.module].push(f);
    return acc;
  }, {});

  const handleToggle = (key: string, value: boolean) => {
    setLocalFlags((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Find only the flags that actually changed to minimize DB writes
      const changed = Object.entries(localFlags).filter(
        ([key, val]) => val !== flags[key]
      );

      for (const [key, enabled] of changed) {
        await toggleFlag(key, enabled);
      }

      setDirty(false);
      toast.success(
        changed.length === 0
          ? "No changes to save"
          : `${changed.length} feature flag${changed.length !== 1 ? "s" : ""} updated - changes are live for all users`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to save feature flags");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalFlags({ ...flags });
    setDirty(false);
  };

  const handleEnableAll = () => {
    const all = Object.fromEntries(FEATURE_DEFINITIONS.map((f) => [f.key, true]));
    setLocalFlags(all);
    setDirty(true);
  };

  const handleDisableAll = () => {
    const all = Object.fromEntries(FEATURE_DEFINITIONS.map((f) => [f.key, false]));
    setLocalFlags(all);
    setDirty(true);
  };

  const enabledCount = Object.values(localFlags).filter(Boolean).length;
  const totalCount = FEATURE_DEFINITIONS.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Summary bar */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">
                    {enabledCount} of {totalCount} Pro features{" "}
                    <span className="text-green-600 font-semibold">unlocked for all users</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggles save to the database and take effect immediately for every user - no page reload needed.
                  Use this to run promotions or open beta features to free-tier users.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEnableAll}
                  className="text-xs gap-1"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Enable All Free
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisableAll}
                  className="text-xs gap-1"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Enforce Tiers
                </Button>
                {dirty && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleReset}
                      className="text-xs gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="text-xs gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grouped feature cards */}
        {Object.entries(grouped).map(([module, features]) => (
          <Card key={module}>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">{module}</CardTitle>
              <CardDescription className="text-xs">
                {features.length} feature{features.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 p-0 pb-1">
              {features.map((feature, idx) => {
                const isEnabled = localFlags[feature.key] ?? false;
                const isAi =
                  feature.label.toLowerCase().includes("ai") ||
                  feature.description.toLowerCase().includes("ai");

                return (
                  <div key={feature.key}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-3 px-5 py-3">
                      {/* Left: labels */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium">{feature.label}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${TIER_COLORS[feature.minTier]}`}
                          >
                            {TIER_LABELS[feature.minTier]}+
                          </Badge>
                          {isAi && (
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0 gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">{feature.description}</p>
                      </div>

                      {/* Right: status + toggle */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px] text-xs">
                            {isEnabled
                              ? "All users (including free tier) can use this feature right now."
                              : `Only users on the ${TIER_LABELS[feature.minTier]} plan or higher can use this.`}
                          </TooltipContent>
                        </Tooltip>

                        <span
                          className={`text-xs font-medium w-16 text-right tabular-nums ${
                            isEnabled ? "text-green-600" : "text-muted-foreground"
                          }`}
                        >
                          {isEnabled ? "Free ✓" : "Pro only"}
                        </span>

                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(val) => handleToggle(feature.key, val)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Unsaved changes sticky footer */}
        {dirty && (
          <div className="sticky bottom-4 flex justify-end">
            <div className="flex items-center gap-3 bg-background border shadow-lg rounded-xl px-4 py-3">
              <span className="text-sm text-muted-foreground">You have unsaved changes</span>
              <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={saving} className="gap-1">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
