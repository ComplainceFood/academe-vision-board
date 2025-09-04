import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestProject, TestExecution, TestCase, TestDefect, TestRequirement } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Target, AlertTriangle, Filter } from 'lucide-react';

export function TestAnalyticsDashboard() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');

  const { data: projects } = useDataFetching<TestProject>({
    table: 'test_projects' as any,
    enabled: true
  });

  const { data: executions } = useDataFetching<TestExecution>({
    table: 'test_executions' as any,
    enabled: true
  });

  const { data: testCases } = useDataFetching<TestCase>({
    table: 'test_cases' as any,
    enabled: true
  });

  const { data: defects } = useDataFetching<TestDefect>({
    table: 'test_defects' as any,
    enabled: true
  });

  const { data: requirements } = useDataFetching<TestRequirement>({
    table: 'test_requirements' as any,
    enabled: true
  });

  // Filter data based on selected project and time range
  const filteredExecutions = executions?.filter(exec => {
    const projectMatch = selectedProject === 'all' || 
      testCases?.find(tc => tc.id === exec.test_case_id);
    
    const timeMatch = timeRange === 'all' || (() => {
      const execDate = new Date(exec.execution_date);
      const now = new Date();
      const days = parseInt(timeRange.replace('d', ''));
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      return execDate >= cutoff;
    })();
    
    return projectMatch && timeMatch;
  }) || [];

  const filteredTestCases = testCases?.filter(tc => {
    if (selectedProject === 'all') return true;
    // Would need to join with suites and projects to filter properly
    return true;
  }) || [];

  const filteredDefects = defects?.filter(defect => {
    if (selectedProject === 'all') return true;
    // Would need to join with executions, test cases, suites, and projects
    return true;
  }) || [];

  const filteredRequirements = requirements?.filter(req => {
    return selectedProject === 'all' || req.project_id === selectedProject;
  }) || [];

  // Calculate analytics
  const analytics = {
    total_tests: filteredTestCases.length,
    passed_tests: filteredExecutions.filter(e => e.status === 'passed').length,
    failed_tests: filteredExecutions.filter(e => e.status === 'failed').length,
    blocked_tests: filteredExecutions.filter(e => e.status === 'blocked').length,
    skipped_tests: filteredExecutions.filter(e => e.status === 'skipped').length,
    not_executed_tests: Math.max(0, filteredTestCases.length - filteredExecutions.length),
    pass_rate: filteredExecutions.length > 0 ? 
      Math.round((filteredExecutions.filter(e => e.status === 'passed').length / filteredExecutions.length) * 100) : 0,
    execution_trend: [], // Would calculate from historical data
    defect_summary: {
      open: filteredDefects.filter(d => d.status === 'open').length,
      in_progress: filteredDefects.filter(d => d.status === 'in_progress').length,
      resolved: filteredDefects.filter(d => d.status === 'resolved').length,
      closed: filteredDefects.filter(d => d.status === 'closed').length,
    },
    coverage_metrics: {
      requirements_covered: 0, // Would need requirement-test case mapping
      total_requirements: filteredRequirements.length,
      coverage_percentage: 0,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Test Analytics & Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into test execution, quality metrics, and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pass_rate}%</div>
            <div className="mt-2">
              <Progress value={analytics.pass_rate} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current test pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.coverage_metrics.coverage_percentage}%</div>
            <div className="mt-2">
              <Progress value={analytics.coverage_metrics.coverage_percentage} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requirements coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Defects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.defect_summary.open}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active defects to resolve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_tests}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Test cases in platform
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Execution Summary</CardTitle>
          <CardDescription>
            Overview of test execution status across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.total_tests === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Test Data Available</h3>
              <p className="text-muted-foreground">
                Create test projects and execute tests to see detailed analytics here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Passed</span>
                    <span className="text-sm text-green-600">{analytics.passed_tests}</span>
                  </div>
                  <Progress value={(analytics.passed_tests / analytics.total_tests) * 100} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Failed</span>
                    <span className="text-sm text-red-600">{analytics.failed_tests}</span>
                  </div>
                  <Progress value={(analytics.failed_tests / analytics.total_tests) * 100} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Blocked</span>
                    <span className="text-sm text-yellow-600">{analytics.blocked_tests}</span>
                  </div>
                  <Progress value={(analytics.blocked_tests / analytics.total_tests) * 100} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Not Executed</span>
                    <span className="text-sm text-gray-600">{analytics.not_executed_tests}</span>
                  </div>
                  <Progress value={(analytics.not_executed_tests / analytics.total_tests) * 100} className="h-2" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defect Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Defect Management Summary</CardTitle>
          <CardDescription>
            Current status of defects across all test projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analytics.defect_summary.open}</div>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{analytics.defect_summary.in_progress}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.defect_summary.resolved}</div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.defect_summary.closed}</div>
              <p className="text-sm text-muted-foreground">Closed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}