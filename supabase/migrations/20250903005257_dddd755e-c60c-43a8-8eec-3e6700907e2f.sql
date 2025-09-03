-- Create testing platform core tables

-- Test projects table
CREATE TABLE public.test_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test suites table
CREATE TABLE public.test_suites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.test_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'functional', -- functional, regression, smoke, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test cases table
CREATE TABLE public.test_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suite_id UUID NOT NULL REFERENCES public.test_suites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  preconditions TEXT,
  test_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_result TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  type TEXT NOT NULL DEFAULT 'manual', -- manual, automated, api, ui, performance, security
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active', -- active, deprecated, archived
  estimated_time INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test executions table
CREATE TABLE public.test_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'not_executed', -- not_executed, passed, failed, blocked, skipped
  actual_result TEXT,
  execution_time INTEGER, -- in minutes
  notes TEXT,
  environment TEXT,
  browser TEXT,
  build_version TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test defects table
CREATE TABLE public.test_defects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.test_executions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed, rejected
  assignee_id UUID,
  external_id TEXT, -- for Jira integration
  external_url TEXT,
  environment TEXT,
  steps_to_reproduce TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test requirements table
CREATE TABLE public.test_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.test_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'functional', -- functional, non_functional, business
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, implemented, tested
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test case requirements mapping
CREATE TABLE public.test_case_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.test_requirements(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_case_id, requirement_id)
);

-- Test automation configs
CREATE TABLE public.test_automation_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  framework TEXT NOT NULL, -- selenium, cypress, playwright, api, etc.
  script_path TEXT,
  config_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_execution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test team members (project-based roles)
CREATE TABLE public.test_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.test_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'tester', -- admin, manager, lead_tester, tester, developer, viewer
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.test_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_case_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_automation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_projects
CREATE POLICY "Users can view projects they are members of" 
ON public.test_projects FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_team_members 
    WHERE project_id = test_projects.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own projects" 
ON public.test_projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners and admins can update projects" 
ON public.test_projects FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_team_members 
    WHERE project_id = test_projects.id AND user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- RLS Policies for test_suites
CREATE POLICY "Users can view suites in their projects" 
ON public.test_suites FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE p.id = test_suites.project_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can create suites" 
ON public.test_suites FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE p.id = test_suites.project_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

-- RLS Policies for test_cases
CREATE POLICY "Users can view test cases in their projects" 
ON public.test_cases FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_suites s 
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE s.id = test_cases.suite_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can create test cases" 
ON public.test_cases FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.test_suites s 
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE s.id = test_cases.suite_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

-- Similar policies for other tables (executions, defects, etc.)
CREATE POLICY "Users can view executions in their projects" 
ON public.test_executions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_cases tc
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE tc.id = test_executions.test_case_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can create executions" 
ON public.test_executions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_test_projects_updated_at
  BEFORE UPDATE ON public.test_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_suites_updated_at
  BEFORE UPDATE ON public.test_suites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_cases_updated_at
  BEFORE UPDATE ON public.test_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_test_suites_project_id ON public.test_suites(project_id);
CREATE INDEX idx_test_cases_suite_id ON public.test_cases(suite_id);
CREATE INDEX idx_test_executions_test_case_id ON public.test_executions(test_case_id);
CREATE INDEX idx_test_executions_status ON public.test_executions(status);
CREATE INDEX idx_test_team_members_project_user ON public.test_team_members(project_id, user_id);