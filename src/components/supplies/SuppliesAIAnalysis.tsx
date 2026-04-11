import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Brain, AlertTriangle, Clock, CheckCircle,
  RefreshCw, TrendingDown, PackageCheck, ShoppingCart
} from "lucide-react";

interface Suggestion {
  item_name: string;
  action: 'reorder_now' | 'reorder_soon' | 'monitor' | 'reduce_threshold' | 'add_items';
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  suggested_quantity: number;
  estimated_cost: number;
}

interface AnalysisResult {
  suggestions: Suggestion[];
  summary?: string;
}

const URGENCY_CONFIG = {
  high: {
    icon: AlertTriangle,
    cardClass: 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20',
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  },
  medium: {
    icon: Clock,
    cardClass: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20',
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  },
  low: {
    icon: CheckCircle,
    cardClass: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20',
    iconClass: 'text-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
};

const ACTION_LABELS: Record<string, string> = {
  reorder_now: 'Reorder Now',
  reorder_soon: 'Reorder Soon',
  monitor: 'Monitor',
  reduce_threshold: 'Adjust Threshold',
  add_items: 'Add Items',
};

export const SuppliesAIAnalysis = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const runAnalysis = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data, error } = await supabase.functions.invoke('ai-supply-analysis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      setResult(data);
      toast({ title: "Analysis complete", description: "AI has reviewed your inventory and generated recommendations." });
    } catch (err) {
      console.error('Supply analysis error:', err);
      toast({ title: "Error", description: "Failed to run supply analysis. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-5 text-white flex items-center gap-3">
          <Brain className="h-5 w-5 animate-pulse" />
          <div>
            <p className="font-semibold">Analysing your inventory…</p>
            <p className="text-white/75 text-sm">AI is reviewing stock levels and usage patterns</p>
          </div>
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-5 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">AI Inventory Analysis</p>
                <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-white/75 text-xs">Smart reorder suggestions powered by Gemini AI</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={runAnalysis}
            disabled={loading}
            className="bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-lg shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {result ? 'Re-analyse' : 'Analyse Inventory'}
          </Button>
        </div>
      </div>

      {result ? (
        <>
          {/* Summary */}
          {result.summary && (
            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
              {result.summary}
            </div>
          )}

          {/* Count pills */}
          <div className="grid grid-cols-3 gap-2">
            {(['high', 'medium', 'low'] as const).map(u => {
              const count = result.suggestions.filter(s => s.urgency === u).length;
              const cfg = URGENCY_CONFIG[u];
              return (
                <div key={u} className={`rounded-xl border p-3 text-center ${cfg.cardClass}`}>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u} urgency</p>
                </div>
              );
            })}
          </div>

          {/* Suggestion cards */}
          <div className="space-y-2">
            {result.suggestions.map((s, i) => {
              const cfg = URGENCY_CONFIG[s.urgency] ?? URGENCY_CONFIG.low;
              const Icon = cfg.icon;
              return (
                <div key={i} className={`rounded-xl border p-4 ${cfg.cardClass}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/70 dark:bg-black/20 shrink-0 mt-0.5">
                      <Icon className={`h-4 w-4 ${cfg.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{s.item_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.badgeClass}`}>
                          {s.urgency}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-background/60 text-muted-foreground">
                          {ACTION_LABELS[s.action] || s.action}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{s.reason}</p>
                      {s.suggested_quantity > 0 && (
                        <div className="flex flex-wrap gap-3 text-xs font-medium text-foreground/80">
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3 text-primary" />
                            Order {s.suggested_quantity} units
                          </span>
                          {s.estimated_cost > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-primary" />
                              Est. ${s.estimated_cost.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="rounded-2xl border border-dashed py-14 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <PackageCheck className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">AI Inventory Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            Let AI analyse your current stock levels and spending patterns to generate smart reorder recommendations.
          </p>
          <Button onClick={runAnalysis}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analyse My Inventory
          </Button>
        </div>
      )}
    </div>
  );
};
