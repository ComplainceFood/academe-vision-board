import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function daysUntil(isoDate: string): number {
  const ms = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function PromoBanner() {
  const { isPromo, subscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  // Reset dismiss state when expiry changes (e.g. user logs in fresh)
  useEffect(() => {
    setDismissed(false);
  }, [subscription.expires_at]);

  // Only show when: status=promo AND expires_at is set (promo has been closed)
  if (!isPromo || !subscription.expires_at || dismissed) return null;

  const days = daysUntil(subscription.expires_at);
  const isUrgent = days <= 3;

  return (
    <div
      className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium ${
        isUrgent
          ? "bg-red-600 text-white"
          : "bg-amber-500 text-white"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {days === 0
            ? "Your free Pro access expires today."
            : `Your free Pro access expires in ${days} day${days !== 1 ? "s" : ""}.`}{" "}
          Upgrade to keep Pro features.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className={`h-7 px-3 text-xs font-semibold ${
            isUrgent
              ? "bg-white text-red-600 hover:bg-white/90"
              : "bg-white text-amber-700 hover:bg-white/90"
          }`}
          onClick={() => navigate("/settings?tab=subscription")}
        >
          <Zap className="h-3 w-3 mr-1" />
          Upgrade now
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
