import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sparkles, Lock, Unlock, RotateCcw, Save, Info } from "lucide-react";
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

  useEffect(() => {
    setLocalFlags({ ...flags });
  }, [flags]);

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
      for (const [key, enabled] of Object.entries(localFlags)) {
        await toggleFlag(key, enabled);
      }
      setDirty(false);
      toast.success("Feature flags saved successfully");
    } catch {
      toast.error("Failed to save feature flags");
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
      <div className="space-y-6">
        {/* Summary bar */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {enabledCount} of {totalCount} Pro features are currently{" "}
                  <span className="text-green-600 font-semibold">unlocked for all users</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Toggle features ON to make them available to free-tier users. Toggle OFF to enforce Pro-only access.
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{module}</CardTitle>
              <CardDescription>
                {features.length} feature{features.length !== 1 ? "s" : ""} in this module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {features.map((feature, idx) => {
                const isEnabled = localFlags[feature.key] ?? false;
                return (
                  <div key={feature.key}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-4 px-6 py-4">
                      {/* Left: labels */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{feature.label}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${TIER_COLORS[feature.minTier]}`}
                          >
                            {TIER_LABELS[feature.minTier]}+
                          </Badge>
                          {feature.label.toLowerCase().includes("ai") ||
                          feature.description.toLowerCase().includes("ai") ? (
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0 gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>

                      {/* Right: status + toggle */}
                      <div className="flex items-center gap-3 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px] text-xs">
                            {isEnabled
                              ? "All users (including free tier) can use this feature right now."
                              : `Only users on ${TIER_LABELS[feature.minTier]} plan or higher can use this.`}
                          </TooltipContent>
                        </Tooltip>

                        <span
                          className={`text-xs font-medium w-14 text-right ${
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
