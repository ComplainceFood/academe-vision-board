import { supabase } from "@/integrations/supabase/client";

export type CheckStatus = 'pass' | 'fail' | 'warning';

export interface CheckResult {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  message: string;
  duration: number;
  details?: string;
}

export interface SuiteDefinition {
  id: string;
  name: string;
  description: string;
  checks: CheckDefinition[];
}

export interface CheckDefinition {
  id: string;
  name: string;
  description: string;
  fn: (userId: string) => Promise<{ status: CheckStatus; message: string; details?: string }>;
}

export interface SuiteResult {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  duration: number;
  checks: CheckResult[];
}

export interface HealthRunResult {
  id: string;
  timestamp: string;
  duration: number;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  overallStatus: CheckStatus;
  suites: SuiteResult[];
}

export interface ScheduleConfig {
  enabled: boolean;
  intervalMinutes: number;
  lastRun: string | null;
}

const SCHEDULE_KEY = 'smartprof_health_schedule';
const HISTORY_KEY = 'smartprof_health_history';
const LAST_RUN_KEY = 'smartprof_last_health_run';
const MAX_HISTORY = 30;

export function loadSchedule(): ScheduleConfig {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, intervalMinutes: 1440, lastRun: null };
  } catch {
    return { enabled: false, intervalMinutes: 1440, lastRun: null };
  }
}

export function saveSchedule(config: ScheduleConfig): void {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(config));
}

export function loadHistory(): HealthRunResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(run: HealthRunResult): void {
  const history = loadHistory();
  const updated = [run, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function loadLastRun(): HealthRunResult | null {
  try {
    const raw = localStorage.getItem(LAST_RUN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastRun(run: HealthRunResult): void {
  localStorage.setItem(LAST_RUN_KEY, JSON.stringify(run));
}

async function runCheck(def: CheckDefinition, userId: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      def.fn(userId),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Check timed out after 10 seconds')), 10000)
      ),
    ]);
    return { id: def.id, name: def.name, description: def.description, ...result, duration: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      status: 'fail',
      message: message.includes('timed out') ? 'Check timed out — the database may be slow or unavailable' : 'An unexpected error occurred during this check',
      details: message,
      duration: Date.now() - start,
    };
  }
}

function suiteStatus(checks: CheckResult[]): CheckStatus {
  if (checks.some(c => c.status === 'fail')) return 'fail';
  if (checks.some(c => c.status === 'warning')) return 'warning';
  return 'pass';
}

export const SUITES: SuiteDefinition[] = [
  {
    id: 'infrastructure',
    name: 'Database & Authentication',
    description: 'Verifies core system connectivity and login session health',
    checks: [
      {
        id: 'db_connection',
        name: 'Database Connection',
        description: 'Confirms the system can reach and query the database',
        fn: async () => {
          const { error } = await supabase.from('notes').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot connect to the database', details: error.message };
          return { status: 'pass', message: 'Database is reachable and responding normally' };
        },
      },
      {
        id: 'auth_session',
        name: 'Login Session',
        description: 'Checks that your current login session is active and secure',
        fn: async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) return { status: 'fail', message: 'No active login session found — please log in again' };
          const expiresAt = data.session.expires_at;
          if (expiresAt && expiresAt * 1000 < Date.now() + 3_600_000) {
            return { status: 'warning', message: 'Your session will expire within the next hour — consider logging out and back in' };
          }
          return { status: 'pass', message: 'Login session is active and valid' };
        },
      },
      {
        id: 'user_profile',
        name: 'Account Access',
        description: 'Verifies your account profile and settings can be loaded',
        fn: async (userId) => {
          const { error } = await supabase.from('user_roles').select('role').eq('user_id', userId).limit(1);
          if (error) return { status: 'fail', message: 'Cannot load account information', details: error.message };
          return { status: 'pass', message: 'Account information loads successfully' };
        },
      },
    ],
  },
  {
    id: 'notes',
    name: 'Notes & Tasks',
    description: 'Tests read and write access to the Notes & Commitments module',
    checks: [
      {
        id: 'notes_read',
        name: 'Read Notes',
        description: 'Checks that notes and tasks can be fetched from the database',
        fn: async () => {
          const { data, error } = await supabase.from('notes').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot retrieve notes data', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Notes module is accessible (no notes created yet)' : 'Notes and tasks are accessible',
          };
        },
      },
      {
        id: 'notes_write',
        name: 'Save & Delete Note',
        description: 'Verifies new notes can be saved and removed from the database',
        fn: async (userId) => {
          const { data: inserted, error: insertError } = await supabase
            .from('notes')
            .insert({
              user_id: userId,
              title: '[SmartProf Health Check — Auto Delete]',
              content: 'Automated test record created by the health monitor. Safe to ignore.',
              type: 'note',
              course: 'Health Check',
              priority: 'low',
              status: 'active',
              starred: false,
              tags: [],
            })
            .select('id')
            .single();

          if (insertError || !inserted) {
            return { status: 'fail', message: 'Cannot save new records to the database', details: insertError?.message };
          }

          const { error: deleteError } = await supabase.from('notes').delete().eq('id', inserted.id);
          if (deleteError) {
            return { status: 'warning', message: 'Records saved successfully but test cleanup failed — a stray test record may exist', details: deleteError.message };
          }

          return { status: 'pass', message: 'Records can be created and deleted correctly' };
        },
      },
    ],
  },
  {
    id: 'meetings',
    name: 'Meetings Hub',
    description: 'Verifies meeting records and action items are accessible',
    checks: [
      {
        id: 'meetings_read',
        name: 'Meeting Records',
        description: 'Checks that scheduled meetings can be retrieved',
        fn: async () => {
          const { data, error } = await supabase.from('meetings').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access meeting records', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Meetings module is accessible (no meetings scheduled yet)' : 'Meeting records are accessible',
          };
        },
      },
    ],
  },
  {
    id: 'grants',
    name: 'Grant Management',
    description: 'Checks grant funding sources and expenditure records',
    checks: [
      {
        id: 'funding_read',
        name: 'Grant Records',
        description: 'Verifies funding sources and grant data can be accessed',
        fn: async () => {
          const { data, error } = await supabase.from('funding_sources').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access grant records', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Grant module is accessible (no grants added yet)' : 'Grant and funding records are accessible',
          };
        },
      },
      {
        id: 'expenditures_read',
        name: 'Expenditure Records',
        description: 'Confirms budget expenditure history can be accessed',
        fn: async () => {
          const { data, error } = await supabase.from('funding_expenditures').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access expenditure records', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Expenditures module is accessible (no expenditures recorded yet)' : 'Expenditure records are accessible',
          };
        },
      },
    ],
  },
  {
    id: 'supplies',
    name: 'Supplies & Inventory',
    description: 'Tests access to inventory management and expense tracking',
    checks: [
      {
        id: 'supplies_read',
        name: 'Inventory Records',
        description: 'Checks that supply and inventory items can be retrieved',
        fn: async () => {
          const { data, error } = await supabase.from('supplies').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access inventory records', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Supplies module is accessible (no items added yet)' : 'Inventory records are accessible',
          };
        },
      },
      {
        id: 'expenses_read',
        name: 'Expense Records',
        description: 'Verifies expense tracking history can be accessed',
        fn: async () => {
          const { data, error } = await supabase.from('expenses').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access expense records', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Expense tracking is accessible (no expenses recorded yet)' : 'Expense records are accessible',
          };
        },
      },
    ],
  },
  {
    id: 'achievements',
    name: 'Scholastic Achievements',
    description: 'Verifies publications, awards, and academic record tracking',
    checks: [
      {
        id: 'achievements_read',
        name: 'Achievement Records',
        description: 'Checks that academic achievements and publications can be retrieved',
        fn: async () => {
          const { data, error } = await supabase.from('scholastic_achievements').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access achievement records', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Achievements module is accessible (no records added yet)' : 'Achievement and publication records are accessible',
          };
        },
      },
    ],
  },
  {
    id: 'planning',
    name: 'Semester Planning',
    description: 'Tests calendar events and semester planning data access',
    checks: [
      {
        id: 'planning_events_read',
        name: 'Calendar Events',
        description: 'Verifies scheduled events and calendar data can be accessed',
        fn: async () => {
          const { data, error } = await supabase.from('planning_events').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access calendar events', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Planning module is accessible (no events scheduled yet)' : 'Calendar events are accessible',
          };
        },
      },
      {
        id: 'future_planning_read',
        name: 'Future Planning Items',
        description: 'Checks that future task planning data can be accessed',
        fn: async () => {
          const { data, error } = await supabase.from('future_planning').select('id').limit(1);
          if (error) return { status: 'fail', message: 'Cannot access future planning records', details: error.message };
          return {
            status: 'pass',
            message: data.length === 0 ? 'Future planning is accessible (no items added yet)' : 'Future planning records are accessible',
          };
        },
      },
    ],
  },
  {
    id: 'access_control',
    name: 'User & Access Control',
    description: 'Confirms user permissions and admin privileges are correctly configured',
    checks: [
      {
        id: 'user_role',
        name: 'Role Assignment',
        description: 'Verifies your account has a role assigned in the system',
        fn: async (userId) => {
          const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId);
          if (error) return { status: 'fail', message: 'Cannot verify user role assignment', details: error.message };
          if (!data || data.length === 0) return { status: 'warning', message: 'No role is assigned to this account — contact an administrator' };
          return { status: 'pass', message: `Account role is correctly assigned (${data[0].role.replace(/_/g, ' ')})` };
        },
      },
      {
        id: 'admin_access',
        name: 'Admin Privileges',
        description: 'Confirms system administrator access is properly configured',
        fn: async (userId) => {
          const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'system_admin');
          if (error) return { status: 'fail', message: 'Cannot verify admin privileges', details: error.message };
          if (!data || data.length === 0) return { status: 'warning', message: 'This account does not have system administrator privileges' };
          return { status: 'pass', message: 'System administrator access is properly configured' };
        },
      },
    ],
  },
];

export async function runAllHealthChecks(
  userId: string,
  onProgress?: (suiteIndex: number, checkIndex: number, completedResult?: CheckResult) => void
): Promise<HealthRunResult> {
  const runStart = Date.now();
  const suiteResults: SuiteResult[] = [];

  for (let si = 0; si < SUITES.length; si++) {
    const suite = SUITES[si];
    const suiteStart = Date.now();
    const checkResults: CheckResult[] = [];

    for (let ci = 0; ci < suite.checks.length; ci++) {
      onProgress?.(si, ci, undefined);
      const result = await runCheck(suite.checks[ci], userId);
      checkResults.push(result);
      onProgress?.(si, ci, result);
    }

    suiteResults.push({
      id: suite.id,
      name: suite.name,
      description: suite.description,
      status: suiteStatus(checkResults),
      duration: Date.now() - suiteStart,
      checks: checkResults,
    });
  }

  const allChecks = suiteResults.flatMap(s => s.checks);
  const passed = allChecks.filter(c => c.status === 'pass').length;
  const failed = allChecks.filter(c => c.status === 'fail').length;
  const warnings = allChecks.filter(c => c.status === 'warning').length;

  const result: HealthRunResult = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    duration: Date.now() - runStart,
    totalChecks: allChecks.length,
    passed,
    failed,
    warnings,
    overallStatus: failed > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass',
    suites: suiteResults,
  };

  saveLastRun(result);
  saveToHistory(result);

  return result;
}
