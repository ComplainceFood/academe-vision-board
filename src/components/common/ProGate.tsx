import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProGateProps {
  /** Feature key from FEATURE_DEFINITIONS */
  featureKey: string;
  /** The content to render when the user has access */
  children: ReactNode;
  /**
   * How to show the gate:
   * - "overlay"  - render children blurred with a lock overlay (default)
   * - "replace"  - replace children entirely with a locked card
   * - "hide"     - render nothing if locked
   */
  variant?: "overlay" | "replace" | "hide";
  /** Optional custom label for the feature name shown in the lock UI */
  featureLabel?: string;
  className?: string;
}

export function ProGate({
  featureKey,
  children,
  variant = "replace",
  featureLabel,
  className,
}: ProGateProps) {
  const { canUse, loading } = useFeatureFlags();

  // While loading tier info, render children so there's no layout flash
  if (loading) return <>{children}</>;

  if (canUse(featureKey)) return <>{children}</>;

  // ── Locked ────────────────────────────────────────────────────────────────

  if (variant === "hide") return null;

  const label = featureLabel ?? featureKey.replace(/_/g, " ");

  if (variant === "overlay") {
    return (
      <div className={cn("relative", className)}>
        {/* Blurred content underneath */}
        <div className="pointer-events-none select-none blur-sm opacity-50">{children}</div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm border border-dashed border-muted-foreground/30 gap-3 p-4">
          <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs px-2 py-0.5">
                <Sparkles className="h-3 w-3 mr-1" />
                Pro Feature
              </Badge>
            </div>
            <p className="text-sm font-medium capitalize">{label}</p>
            <p className="text-xs text-muted-foreground">Upgrade to Pro to unlock this feature</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs" asChild>
            <a href="/settings?tab=subscription">Upgrade to Pro</a>
          </Button>
        </div>
      </div>
    );
  }

  // variant === "replace"
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center",
        className
      )}
    >
      <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs px-2 py-0.5">
            <Sparkles className="h-3 w-3 mr-1" />
            Pro Feature
          </Badge>
        </div>
        <p className="font-medium capitalize">{label}</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          This feature is available on the Pro plan. Upgrade to unlock it.
        </p>
      </div>
      <Button size="sm" variant="outline" asChild>
        <a href="/settings?tab=subscription">Upgrade to Pro</a>
      </Button>
    </div>
  );
}
