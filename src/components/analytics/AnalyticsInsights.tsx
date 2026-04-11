import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  BookOpen
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Insight {
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

const PRIORITY_CONFIG = {
  high: {
    icon: AlertTriangle,
    label: 'High Priority',
    cardClass: 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20',
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-500',
  },
  medium: {
    icon: Clock,
    label: 'Medium Priority',
    cardClass: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20',
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  low: {
    icon: CheckCircle,
    label: 'Low Priority',
    cardClass: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20',
    iconClass: 'text-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
};

export const AnalyticsInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateInsights = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      if (error) throw error;
      setInsights(data?.insights || []);
      toast({ title: "Insights ready", description: "AI has analysed your data and generated personalised recommendations." });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({ title: "Error", description: "Failed to generate insights. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading header */}
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Analysing your data…</h3>
              <p className="text-white/80 text-sm">AI is reviewing your academic activities</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">AI Insights</h3>
                <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-white/80 text-sm">Powered by Gemini AI — personalised for your academic profile</p>
            </div>
          </div>
          <Button
            onClick={generateInsights}
            disabled={loading}
            className="bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-lg shrink-0"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {insights.length > 0 ? 'Regenerate' : 'Generate Insights'}
          </Button>
        </div>
      </div>

      {insights.length > 0 ? (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            {(['high', 'medium', 'low'] as const).map(p => {
              const count = insights.filter(i => i.priority === p).length;
              const cfg = PRIORITY_CONFIG[p];
              return (
                <div key={p} className={`rounded-xl border p-3 text-center ${cfg.cardClass}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
                </div>
              );
            })}
          </div>

          {/* Insight cards */}
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const cfg = PRIORITY_CONFIG[insight.priority] ?? PRIORITY_CONFIG.low;
              const Icon = cfg.icon;
              return (
                <div key={index} className={`rounded-xl border p-4 transition-all hover:shadow-md ${cfg.cardClass}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg bg-white/70 dark:bg-black/20 shrink-0`}>
                      <Icon className={`h-4 w-4 ${cfg.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.badgeClass}`}>
                          {insight.priority}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-background/60 text-muted-foreground">
                          {insight.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{insight.description}</p>
                      <div className="flex items-start gap-1.5 text-xs font-medium text-foreground/80">
                        <Target className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        <span>{insight.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No insights yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
            Click the button above to let AI analyse your notes, meetings, grants, and achievements — and get personalised recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6 text-xs text-muted-foreground">
            {['Task Management', 'Grant Deadlines', 'Supply Alerts', 'Productivity Tips', 'Research Insights'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full border bg-background">{tag}</span>
            ))}
          </div>
          <Button onClick={generateInsights} className="shadow-lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate My Insights
          </Button>
        </div>
      )}
    </div>
  );
};
