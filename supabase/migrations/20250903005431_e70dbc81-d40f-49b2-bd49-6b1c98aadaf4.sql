-- Add missing RLS policies for testing platform tables

-- Complete RLS policies for test_defects
CREATE POLICY "Users can view defects in their projects" 
ON public.test_defects FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_executions te
    JOIN public.test_cases tc ON te.test_case_id = tc.id
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE te.id = test_defects.execution_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can create defects" 
ON public.test_defects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update defects" 
ON public.test_defects FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_executions te
    JOIN public.test_cases tc ON te.test_case_id = tc.id
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE te.id = test_defects.execution_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager', 'lead_tester')
  )
);

-- Complete RLS policies for test_requirements  
CREATE POLICY "Users can view requirements in their projects" 
ON public.test_requirements FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE p.id = test_requirements.project_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can create requirements" 
ON public.test_requirements FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE p.id = test_requirements.project_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can update requirements" 
ON public.test_requirements FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE p.id = test_requirements.project_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager', 'lead_tester')
  )
);

-- RLS policies for test_case_requirements
CREATE POLICY "Users can view test case requirements in their projects" 
ON public.test_case_requirements FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_cases tc
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE tc.id = test_case_requirements.test_case_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can create test case requirements" 
ON public.test_case_requirements FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.test_cases tc
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE tc.id = test_case_requirements.test_case_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

-- RLS policies for test_automation_configs
CREATE POLICY "Users can view automation configs in their projects" 
ON public.test_automation_configs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_cases tc
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE tc.id = test_automation_configs.test_case_id 
    AND (p.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "Team members can create automation configs" 
ON public.test_automation_configs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can update automation configs" 
ON public.test_automation_configs FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_cases tc
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE tc.id = test_automation_configs.test_case_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager', 'lead_tester', 'developer')
  )
);

-- RLS policies for test_team_members
CREATE POLICY "Users can view team members in their projects" 
ON public.test_team_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    WHERE p.id = test_team_members.project_id 
    AND (p.user_id = auth.uid() OR test_team_members.user_id = auth.uid())
  )
);

CREATE POLICY "Project owners and admins can manage team members" 
ON public.test_team_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    WHERE p.id = test_team_members.project_id 
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.test_team_members tm
    WHERE tm.project_id = test_team_members.project_id 
    AND tm.user_id = auth.uid() AND tm.role = 'admin'
  )
);

CREATE POLICY "Project owners and admins can update team members" 
ON public.test_team_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    WHERE p.id = test_team_members.project_id 
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.test_team_members tm
    WHERE tm.project_id = test_team_members.project_id 
    AND tm.user_id = auth.uid() AND tm.role = 'admin'
  )
);

CREATE POLICY "Project owners and admins can delete team members" 
ON public.test_team_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    WHERE p.id = test_team_members.project_id 
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.test_team_members tm
    WHERE tm.project_id = test_team_members.project_id 
    AND tm.user_id = auth.uid() AND tm.role = 'admin'
  )
);

-- Add missing UPDATE and DELETE policies for other tables
CREATE POLICY "Team members can update test suites" 
ON public.test_suites FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE p.id = test_suites.project_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager', 'lead_tester')
  )
);

CREATE POLICY "Team members can delete test suites" 
ON public.test_suites FOR DELETE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_projects p 
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE p.id = test_suites.project_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Team members can update test cases" 
ON public.test_cases FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_suites s 
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE s.id = test_cases.suite_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager', 'lead_tester', 'tester')
  )
);

CREATE POLICY "Team members can delete test cases" 
ON public.test_cases FOR DELETE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_suites s 
    JOIN public.test_projects p ON s.project_id = p.id
    LEFT JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE s.id = test_cases.suite_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager', 'lead_tester')
  )
);

CREATE POLICY "Team members can update executions" 
ON public.test_executions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Team members can delete executions" 
ON public.test_executions FOR DELETE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.test_cases tc
    JOIN public.test_suites s ON tc.suite_id = s.id
    JOIN public.test_projects p ON s.project_id = p.id
    JOIN public.test_team_members tm ON p.id = tm.project_id
    WHERE tc.id = test_executions.test_case_id 
    AND tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager', 'lead_tester')
  )
);