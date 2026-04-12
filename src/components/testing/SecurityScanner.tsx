import React, { useState, useCallback } from "react";
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX,
  ChevronDown, ChevronRight, Play, Clock,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw,
  Lock, Eye, Code2, Database, Key, Package, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  runSecurityScan,
  loadLastScan,
  loadScanHistory,
  SecurityScanResult,
  SECURITY_SUITES,
} from "@/services/securityScanService";
import { CheckResult, SuiteResult } from "@/services/healthCheckService";

const SUITE_ICONS: Record<string, React.ElementType> = {
  transport: Lock,
  authentication: Key,
  data_access: Database,
  injection: Code2,
  secrets: Eye,
  dependencies: Package,
};

function statusIcon(status: string, className = "h-4 w-4") {
  if (status === "pass") return <CheckCircle2 className={cn(className, "text-emerald-500")} />;
  if (status === "fail") return <XCircle className={cn(className, "text-red-500")} />;
  return <AlertTriangle className={cn(className, "text-amber-500")} />;
}

function statusBadge(status: string) {
  if (status === "pass") return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Pass</Badge>;
  if (status === "fail") return <Badge className="bg-red-100 text-red-700 border-red-200">Fail</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Warning</Badge>;
}

function riskLabel(score: number): { label: string; color: string } {
  if (score === 0) return { label: "Secure", color: "text-emerald-600" };
  if (score <= 15) return { label: "Low Risk", color: "text-emerald-500" };
  if (score <= 35) return { label: "Moderate Risk", color: "text-amber-500" };
  if (score <= 60) return { label: "High Risk", color: "text-orange-500" };
  return { label: "Critical Risk", color: "text-red-600" };
}

function riskBarColor(score: number): string {
  if (score <= 15) return "bg-emerald-500";
  if (score <= 35) return "bg-amber-500";
  if (score <= 60) return "bg-orange-500";
  return "bg-red-500";
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// --- Suite card ---
function SuiteCard({ suite }: { suite: SuiteResult }) {
  const [expanded, setExpanded] = useState(suite.status !== "pass");
  const Icon = SUITE_ICONS[suite.id] || Shield;

  return (
    <Card className="border shadow-sm">
      <CardHeader
        className="py-3 px-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              suite.status === "pass" ? "bg-emerald-50" :
              suite.status === "fail" ? "bg-red-50" : "bg-amber-50"
            )}>
              <Icon className={cn(
                "h-4 w-4",
                suite.status === "pass" ? "text-emerald-600" :
                suite.status === "fail" ? "text-red-500" : "text-amber-500"
              )} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold">{suite.name}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{suite.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:block">{formatDuration(suite.duration)}</span>
            {statusBadge(suite.status)}
            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-4 space-y-2">
          {suite.checks.map(check => (
            <CheckRow key={check.id} check={check} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// --- Check row ---
function CheckRow({ check }: { check: CheckResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!check.details;

  return (
    <div className={cn(
      "rounded-lg border p-3 text-sm",
      check.status === "pass" ? "bg-emerald-50/50 border-emerald-100" :
      check.status === "fail" ? "bg-red-50/50 border-red-100" : "bg-amber-50/50 border-amber-100"
    )}>
      <div
        className={cn("flex items-start gap-2", hasDetails && "cursor-pointer")}
        onClick={() => hasDetails && setExpanded(e => !e)}
      >
        <div className="mt-0.5 shrink-0">{statusIcon(check.status)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{check.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{formatDuration(check.duration)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
        </div>
        {hasDetails && (
          <div className="shrink-0 mt-0.5">
            {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        )}
      </div>
      {expanded && check.details && (
        <div className="mt-2 ml-6 p-2 rounded bg-white/70 border text-xs text-muted-foreground leading-relaxed">
          {check.details}
        </div>
      )}
    </div>
  );
}

// --- Risk score gauge ---
function RiskGauge({ score }: { score: number }) {
  const { label, color } = riskLabel(score);
  const barColor = riskBarColor(score);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Risk Score</span>
        <span className={cn("text-sm font-bold", color)}>{label}</span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Secure</span>
        <span className={cn("font-semibold", color)}>{score}/100</span>
        <span>Critical</span>
      </div>
    </div>
  );
}

// --- Live progress overlay ---
function ScanProgress({ suiteIdx, checkIdx, total }: { suiteIdx: number; checkIdx: number; total: number }) {
  const suite = SECURITY_SUITES[suiteIdx];
  const check = suite?.checks[checkIdx];
  const completedSuites = SECURITY_SUITES.slice(0, suiteIdx).reduce((a, s) => a + s.checks.length, 0);
  const done = completedSuites + checkIdx;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="font-medium">Running security scan...</span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="text-xs text-muted-foreground">
        {suite && <span>{suite.name} — {check?.name ?? "..."}</span>}
        <span className="float-right">{done}/{total} checks</span>
      </div>
    </div>
  );
}

// --- Main component ---
export function SecurityScanner() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ suiteIdx: number; checkIdx: number } | null>(null);
  const [result, setResult] = useState<SecurityScanResult | null>(() => loadLastScan());
  const [history, setHistory] = useState<SecurityScanResult[]>(() => loadScanHistory());
  const [showHistory, setShowHistory] = useState(false);

  const totalChecks = SECURITY_SUITES.reduce((a, s) => a + s.checks.length, 0);

  const runScan = useCallback(async () => {
    if (!user?.id || running) return;
    setRunning(true);
    setProgress({ suiteIdx: 0, checkIdx: 0 });

    try {
      const scan = await runSecurityScan(user.id, (si, ci) => {
        setProgress({ suiteIdx: si, checkIdx: ci });
      });
      setResult(scan);
      setHistory(loadScanHistory());
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }, [user?.id, running]);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card>
        <CardContent className="p-5 space-y-4">
          {running && progress ? (
            <ScanProgress suiteIdx={progress.suiteIdx} checkIdx={progress.checkIdx} total={totalChecks} />
          ) : result ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold">{result.totalChecks}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Total Checks</div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{result.passed}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Passed</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{result.warnings}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Warnings</div>
                </div>
                <div className="rounded-xl bg-red-50 p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Failed</div>
                </div>
              </div>
              <RiskGauge score={result.riskScore} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last scan: {formatTimestamp(result.timestamp)} ({formatDuration(result.duration)})</span>
                </div>
                {statusBadge(result.overallStatus)}
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No scan results yet. Run your first security scan.</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={runScan}
              disabled={running || !user?.id}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, #1B7A5A, #0D5C3E)", color: "#fff", border: "none" }}
            >
              {running ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Run Security Scan</>
              )}
            </Button>
            {history.length > 0 && (
              <Button variant="outline" onClick={() => setShowHistory(h => !h)}>
                <Clock className="h-4 w-4 mr-1.5" />
                History ({history.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan history */}
      {showHistory && history.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Scan History</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {history.map(h => {
              const { label, color } = riskLabel(h.riskScore);
              return (
                <div key={h.id} className="flex items-center justify-between text-sm rounded-lg border p-2.5">
                  <div className="flex items-center gap-2">
                    {statusIcon(h.overallStatus)}
                    <span className="text-muted-foreground">{formatTimestamp(h.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>{h.passed}P / {h.warnings}W / {h.failed}F</span>
                    <span className={cn("font-semibold", color)}>{label} ({h.riskScore})</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Suite results */}
      {result && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Scan Results by Category
          </h3>
          {result.suites.map(suite => (
            <SuiteCard key={suite.id} suite={suite} />
          ))}
        </div>
      )}
    </div>
  );
}
