export interface TestProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance' | 'security';
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  id: string;
  suite_id: string;
  user_id: string;
  title: string;
  description?: string;
  preconditions?: string;
  test_steps: TestStep[];
  expected_result?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'manual' | 'automated' | 'api' | 'ui' | 'performance' | 'security';
  tags: string[];
  status: 'active' | 'deprecated' | 'archived';
  estimated_time?: number;
  created_at: string;
  updated_at: string;
}

export interface TestStep {
  step: number;
  action: string;
  expected_result?: string;
}

export interface TestExecution {
  id: string;
  test_case_id: string;
  user_id: string;
  execution_date: string;
  status: 'not_executed' | 'passed' | 'failed' | 'blocked' | 'skipped';
  actual_result?: string;
  execution_time?: number;
  notes?: string;
  environment?: string;
  browser?: string;
  build_version?: string;
  attachments: any[];
  created_at: string;
}

export interface TestDefect {
  id: string;
  execution_id: string;
  user_id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  assignee_id?: string;
  external_id?: string;
  external_url?: string;
  environment?: string;
  steps_to_reproduce?: string;
  created_at: string;
  updated_at: string;
}

export interface TestRequirement {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description?: string;
  type: 'functional' | 'non_functional' | 'business';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'approved' | 'implemented' | 'tested';
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TestTeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'lead_tester' | 'tester' | 'developer' | 'viewer';
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface TestAutomationConfig {
  id: string;
  test_case_id: string;
  user_id: string;
  framework: string;
  script_path?: string;
  config_data: Record<string, any>;
  is_active: boolean;
  last_execution?: string;
  created_at: string;
  updated_at: string;
}

export interface TestAnalytics {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  blocked_tests: number;
  skipped_tests: number;
  not_executed_tests: number;
  pass_rate: number;
  execution_trend: Array<{ date: string; passed: number; failed: number; }>;
  defect_summary: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  coverage_metrics: {
    requirements_covered: number;
    total_requirements: number;
    coverage_percentage: number;
  };
}

export type TestStatus = 'not_executed' | 'passed' | 'failed' | 'blocked' | 'skipped';
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';
export type TestType = 'manual' | 'automated' | 'api' | 'ui' | 'performance' | 'security';
export type UserRole = 'admin' | 'manager' | 'lead_tester' | 'tester' | 'developer' | 'viewer';