import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2, XCircle, AlertTriangle, Play, Clock, RefreshCw,
  ChevronDown, ChevronUp, CalendarClock, History, ShieldCheck,
  Database, FileText, Users, Wallet, Package, Award, Calendar, Lock,
  Loader2, CircleDot,
} from 'lucide-react';
import {
  runAllHealthChecks, loadSchedule, saveSchedule, loadHistory, loadLastRun,
  SUITES,
  type CheckResult, type SuiteResult, type HealthRunResult, type CheckStatus, type ScheduleConfig,
} from '@/services/healthCheckService';
import { useAuth } from '@/hooks/useAuth';

// ── helpers ──────────────────────────────────────────────────────────────────

const SUITE_ICONS: Record<string, React.ElementType> = {
  infrastructure: Database,
  notes: FileText,
  meetings: Users,
  grants: Wallet,
  supplies: Package,
  achievements: Award,
  planning: Calendar,
  access_control: Lock,
};

const INTERVAL_OPTIONS = [
  { label: 'Every hour', value: 60 },
  { label: 'Every 6 hours', value: 360 },
  { label: 'Every 12 hours', value: 720 },
  { label: 'Once daily', value: 1440 },
  { label: 'Once weekly', value: 10080 },
];

function statusColor(s: CheckStatus) {
  if (s === 'pass') return 'text-emerald-600 dark:text-emerald-400';
  if (s === 'fail') return 'text-destructive';
  return 'text-amber-500 dark:text-amber-400';
}

function statusBg(s: CheckStatus) {
  if (s === 'pass') return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800';
  if (s === 'fail') return 'bg-destructive/5 border-destructive/20';
  return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
}

function StatusIcon({ status, size = 'md' }: { status: CheckStatus | 'running' | 'pending'; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  if (status === 'running') return <Loader2 className={`${cls} animate-spin text-primary`} />;
  if (status === 'pending') return <CircleDot className={`${cls} text-muted-foreground/40`} />;
  if (status === 'pass') return <CheckCircle2 className={`${cls} text-emerald-500`} />;
  if (status === 'fail') return <XCircle className={`${cls} text-destructive`} />;
  return <AlertTriangle className={`${cls} text-amber-500`} />;
}

function OverallBanner({ result }: { result: HealthRunResult }) {
  const ok = result.overallStatus === 'pass';
  const warn = result.overallStatus === 'warning';
  return (
    <div className={`rounded-2xl p-6 border-2 ${ok ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : warn ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' : 'bg-destructive/5 border-destructive/25'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`p-3 rounded-xl ${ok ? 'bg-emerald-100 dark:bg-emerald-900/50' : warn ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-destructive/10'}`}>
          {ok ? <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" /> : warn ? <AlertTriangle className="h-8 w-8 text-amber-500" /> : <XCircle className="h-8 w-8 text-destructive" />}
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${statusColor(result.overallStatus)}`}>
            {ok ? 'All Systems Operational' : warn ? 'Systems Running with Warnings' : 'Issues Detected'}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ok
              ? `All ${result.totalChecks} checks passed — the platform is working correctly`
              : warn
              ? `${result.passed} passed, ${result.warnings} warning${result.warnings > 1 ? 's' : ''} — review the highlighted items below`
              : `${result.failed} check${result.failed > 1 ? 's' : ''} failed — attention required`}
          </p>
        </div>
        <div className="flex gap-4 text-sm font-medium shrink-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.passed}</div>
            <div className="text-muted-foreground">Passed</div>
          </div>
          {result.warnings > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{result.warnings}</div>
              <div className="text-muted-foreground">Warnings</div>
            </div>
          )}
          {result.failed > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{result.failed}</div>
              <div className="text-muted-foreground">Failed</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckRow({ check, state }: { check: CheckResult | null; defName: string; defDesc: string; state: 'pending' | 'running' | 'done' }) {
  const [expanded, setExpanded] = useState(false);
  if (state !== 'done' || !check) {
    return (
      <div className="flex items-center gap-3 py-2.5">
        <StatusIcon status={state === 'running' ? 'running' : 'pending'} size="sm" />
        <span className="text-sm text-muted-foreground">{state === 'running' ? 'Running…' : 'Waiting…'}</span>
      </div>
    );
  }
  return (
    <div>
      <button
        type="button"
        className="w-full flex items-start gap-3 py-2.5 text-left group"
        onClick={() => check.details && setExpanded(e => !e)}
      >
        <div className="mt-0.5 shrink-0"><StatusIcon status={check.status} size="sm" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{check.name}</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${statusColor(check.status)}`}>
              {check.status}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{check.duration}ms</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
        </div>
        {check.details && (
          <div className="shrink-0 mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        )}
      </button>
      <AnimatePresence>
        {expanded && check.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-7 mb-2 p-3 rounded-lg bg-muted/60 border border-border/50 text-xs text-muted-foreground font-mono break-all">
              {check.details}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuiteCard({
  suite,
  activeSuiteIndex,
  activeCheckIndex,
  suiteIndex,
  liveChecks,
  result,
}: {
  suite: { id: string; name: string; description: string; checks: { id: string; name: string; description: string }[] };
  activeSuiteIndex: number;
  activeCheckIndex: number;
  suiteIndex: number;
  liveChecks: CheckResult[];
  result: SuiteResult | null;
}) {
  const Icon = SUITE_ICONS[suite.id] ?? Database;
  const isCurrent = activeSuiteIndex === suiteIndex;
  const isDone = activeSuiteIndex > suiteIndex || result !== null;
  const isPending = activeSuiteIndex < suiteIndex && result === null;

  const cardStatus: CheckStatus | 'running' | 'pending' = isPending
    ? 'pending'
    : isCurrent
    ? 'running'
    : result?.status ?? 'pass';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: suiteIndex * 0.05 }}
    >
      <Card className={`h-full border ${isDone && result ? statusBg(result.status) : 'border-border'} transition-colors duration-300`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isDone && result ? statusBg(result.status) : 'bg-muted border-border'}`}>
              <Icon className={`h-5 w-5 ${isDone && result ? statusColor(result.status) : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{suite.name}</CardTitle>
              <CardDescription className="text-xs leading-snug">{suite.description}</CardDescription>
            </div>
            <StatusIcon status={cardStatus} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border/50">
            {suite.checks.map((checkDef, ci) => {
              const done = isDone || (isCurrent && ci < activeCheckIndex) || (isCurrent && ci === activeCheckIndex && liveChecks[ci] !== undefined);
              const running = isCurrent && ci === activeCheckIndex && !done;
              const pending = isPending || (isCurrent && ci > activeCheckIndex);
              const state: 'pending' | 'running' | 'done' = done ? 'done' : running ? 'running' : 'pending';
              const checkResult = liveChecks[ci] ?? result?.checks.find(c => c.id === checkDef.id) ?? null;
              return (
                <CheckRow
                  key={checkDef.id}
                  check={checkResult}
                  defName={checkDef.name}
                  defDesc={checkDef.description}
                  state={state}
                />
              );
            })}
          </div>
          {isDone && result && (
            <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
              <span>{result.checks.filter(c => c.status === 'pass').length}/{result.checks.length} passed</span>
              <span>{result.duration}ms total</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HistoryRow({ run, expanded, onToggle }: { run: HealthRunResult; expanded: boolean; onToggle: () => void }) {
  const ok = run.overallStatus === 'pass';
  const warn = run.overallStatus === 'warning';
  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button type="button" className="w-full flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors text-left" onClick={onToggle}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${ok ? 'bg-emerald-500' : warn ? 'bg-amber-400' : 'bg-destructive'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {new Date(run.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(run.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{run.passed} passed</span>
            {run.warnings > 0 && <span className="text-amber-500 font-medium">{run.warnings} warning{run.warnings > 1 ? 's' : ''}</span>}
            {run.failed > 0 && <span className="text-destructive font-medium">{run.failed} failed</span>}
            <span>·  {(run.duration / 1000).toFixed(1)}s</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="p-4 space-y-3 bg-muted/20">
              {run.suites.map(suite => (
                <div key={suite.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusIcon status={suite.status} size="sm" />
                    <span className="text-sm font-semibold text-foreground">{suite.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{suite.duration}ms</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {suite.checks.map(check => (
                      <div key={check.id} className="flex items-start gap-2 text-xs">
                        <StatusIcon status={check.status} size="sm" />
                        <div>
                          <span className="font-medium text-foreground">{check.name}</span>
                          <span className="text-muted-foreground"> — {check.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function SystemHealthRunner() {
  const { user } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<HealthRunResult | null>(() => loadLastRun());
  const [history, setHistory] = useState<HealthRunResult[]>(() => loadHistory());
  const [schedule, setSchedule] = useState<ScheduleConfig>(() => loadSchedule());
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // live progress state
  const [activeSuiteIndex, setActiveSuiteIndex] = useState(-1);
  const [activeCheckIndex, setActiveCheckIndex] = useState(-1);
  const [liveChecksPerSuite, setLiveChecksPerSuite] = useState<Record<number, CheckResult[]>>({});

  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  const handleRun = useCallback(async () => {
    if (!user || isRunning) return;
    setIsRunning(true);
    setActiveSuiteIndex(0);
    setActiveCheckIndex(0);
    setLiveChecksPerSuite({});

    try {
      const result = await runAllHealthChecks(user.id, (si, ci, completed) => {
        setActiveSuiteIndex(si);
        setActiveCheckIndex(ci);
        if (completed) {
          setLiveChecksPerSuite(prev => {
            const existing = prev[si] ?? [];
            return { ...prev, [si]: [...existing, completed] };
          });
        }
      });

      setLastResult(result);
      setHistory(loadHistory());
    } finally {
      setIsRunning(false);
      setActiveSuiteIndex(-1);
      setActiveCheckIndex(-1);
    }
  }, [user, isRunning]);

  // Scheduled runs
  useEffect(() => {
    const timer = setInterval(() => {
      const { enabled, intervalMinutes, lastRun } = scheduleRef.current;
      if (!enabled || !user) return;
      const now = Date.now();
      const last = lastRun ? new Date(lastRun).getTime() : 0;
      if (now - last >= intervalMinutes * 60 * 1000) {
        const updated = { ...scheduleRef.current, lastRun: new Date().toISOString() };
        setSchedule(updated);
        saveSchedule(updated);
        handleRun();
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [user, handleRun]);

  const handleSaveSchedule = (newConfig: ScheduleConfig) => {
    setSchedule(newConfig);
    saveSchedule(newConfig);
  };

  const nextRunLabel = () => {
    if (!schedule.enabled) return null;
    const last = schedule.lastRun ? new Date(schedule.lastRun).getTime() : 0;
    const nextMs = last + schedule.intervalMinutes * 60 * 1000;
    const diffMs = nextMs - Date.now();
    if (diffMs <= 0) return 'Due now';
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin < 60) return `in ${diffMin} minute${diffMin !== 1 ? 's' : ''}`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `in ${diffHr} hour${diffHr !== 1 ? 's' : ''}`;
    const diffDay = Math.round(diffHr / 24);
    return `in ${diffDay} day${diffDay !== 1 ? 's' : ''}`;
  };

  const lastRunLabel = () => {
    if (!lastResult) return 'Never run';
    const diff = Date.now() - new Date(lastResult.timestamp).getTime();
    const min = Math.round(diff / 60_000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min} minute${min !== 1 ? 's' : ''} ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
    const day = Math.round(hr / 24);
    return `${day} day${day !== 1 ? 's' : ''} ago`;
  };

  const totalChecks = SUITES.flatMap(s => s.checks).length;
  const completedChecks = isRunning
    ? Object.values(liveChecksPerSuite).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="space-y-8">
      {/* ── Control Bar ── */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span>Last checked: <strong className="text-foreground">{lastRunLabel()}</strong></span>
              </div>
              {schedule.enabled && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  <span>Next auto-run: <strong className="text-foreground">{nextRunLabel()}</strong></span>
                </div>
              )}
            </div>

            {isRunning && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Running check {completedChecks + 1} of {totalChecks}…</span>
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${(completedChecks / totalChecks) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleRun}
                disabled={isRunning || !user}
                className="gap-2 px-8 font-semibold"
              >
                {isRunning ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Running…</>
                ) : (
                  <><Play className="h-4 w-4" />Run All Checks Now</>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowHistory(h => !h)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History
                {history.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{history.length}</Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Overall Result Banner ── */}
      <AnimatePresence mode="wait">
        {lastResult && !isRunning && (
          <motion.div key={lastResult.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <OverallBanner result={lastResult} />
          </motion.div>
        )}
        {!lastResult && !isRunning && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No checks have been run yet</h3>
              <p className="text-sm text-muted-foreground">Click <strong>Run All Checks Now</strong> to test every module of the platform.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Suite Cards Grid ── */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Module Health Checks</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {SUITES.map((suite, si) => (
            <SuiteCard
              key={suite.id}
              suite={suite}
              suiteIndex={si}
              activeSuiteIndex={isRunning ? activeSuiteIndex : -1}
              activeCheckIndex={isRunning ? activeCheckIndex : -1}
              liveChecks={liveChecksPerSuite[si] ?? []}
              result={isRunning ? null : (lastResult?.suites.find(s => s.id === suite.id) ?? null)}
            />
          ))}
        </div>
      </div>

      {/* ── Schedule Configuration ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Automatic Schedule</CardTitle>
              <CardDescription>Run health checks automatically at a set interval</CardDescription>
            </div>
            {schedule.enabled && (
              <Badge className="ml-auto bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-medium text-foreground">Check frequency</label>
              <Select
                value={String(schedule.intervalMinutes)}
                onValueChange={v => setSchedule(prev => ({ ...prev, intervalMinutes: Number(v) }))}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                variant={schedule.enabled ? 'destructive' : 'default'}
                onClick={() => handleSaveSchedule({ ...schedule, enabled: !schedule.enabled, lastRun: schedule.enabled ? schedule.lastRun : new Date().toISOString() })}
              >
                {schedule.enabled ? 'Disable Schedule' : 'Enable Schedule'}
              </Button>
              {schedule.enabled && (
                <Button variant="outline" onClick={() => handleSaveSchedule({ ...schedule, intervalMinutes: schedule.intervalMinutes })}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
          {schedule.enabled && schedule.lastRun && (
            <p className="text-sm text-muted-foreground mt-4">
              Last auto-run: {new Date(schedule.lastRun).toLocaleString()} · Next: {nextRunLabel()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Run History ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted border border-border">
                      <History className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Run History</CardTitle>
                      <CardDescription>Last {history.length} health check runs</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No history yet — run your first health check above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map(run => (
                      <HistoryRow
                        key={run.id}
                        run={run}
                        expanded={expandedHistory === run.id}
                        onToggle={() => setExpandedHistory(prev => prev === run.id ? null : run.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
