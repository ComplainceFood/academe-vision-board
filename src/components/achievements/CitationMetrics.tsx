import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, RefreshCw, Loader2, ExternalLink, Info } from "lucide-react";
import { fetchAuthorMetrics, AuthorMetrics } from "@/services/citationService";

interface CitationMetricsProps {
  orcidId?: string | null;
}

export function CitationMetrics({ orcidId }: CitationMetricsProps) {
  const [metrics, setMetrics] = useState<AuthorMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = async () => {
    if (!orcidId) return;
    setLoading(true);
    try {
      const data = await fetchAuthorMetrics(orcidId);
      setMetrics(data);
      setLastFetched(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcidId]);

  if (!orcidId) return null;

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Citation Impact</p>
              <p className="text-xs text-muted-foreground">via OpenAlex · ORCID-linked</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastFetched && (
              <span className="text-[10px] text-muted-foreground">
                Updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={load}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {loading && !metrics ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching citation data…
          </div>
        ) : metrics ? (
          <TooltipProvider>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="h-index"
                value={metrics.hIndex}
                tooltip="Largest number h such that h publications each have at least h citations."
              />
              <MetricCard
                label="i10-index"
                value={metrics.i10Index}
                tooltip="Number of publications with at least 10 citations."
              />
              <MetricCard
                label="Total Citations"
                value={metrics.totalCitations.toLocaleString()}
                tooltip="Sum of citations across all your works indexed in OpenAlex."
              />
              <MetricCard
                label="Works Indexed"
                value={metrics.worksCount}
                tooltip="Number of your works found in the OpenAlex database."
              />
            </div>

            {metrics.openAlexId && (
              <div className="mt-3 flex justify-end">
                <a
                  href={metrics.openAlexId}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  View on OpenAlex
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </TooltipProvider>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            No citation data found. Ensure your ORCID profile has public publications.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string | number;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-background/70 rounded-xl p-3 text-center cursor-default border border-blue-100 dark:border-blue-900 hover:border-blue-300 transition-colors">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
            {label}
            <Info className="h-3 w-3 opacity-50" />
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px] text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
