import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestExecution, TestCase, TestProject } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Clock, CheckCircle, XCircle, AlertCircle, SkipForward, Filter } from 'lucide-react';

export function TestExecutionDashboard() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: executions, isLoading: executionsLoading } = useDataFetching<TestExecution>({
    table: 'test_executions' as any,
    enabled: true
  });

  const { data: testCases } = useDataFetching<TestCase>({
    table: 'test_cases' as any,
    enabled: true
  });

  const { data: projects } = useDataFetching<TestProject>({
    table: 'test_projects' as any,
    enabled: true
  });

  // Calculate execution statistics
  const filteredExecutions = executions?.filter(exec => {
    const projectMatch = selectedProject === 'all' || 
      testCases?.find(tc => tc.id === exec.test_case_id && 
        testCases.find(c => c.suite_id === tc.suite_id));
    const statusMatch = statusFilter === 'all' || exec.status === statusFilter;
    return projectMatch && statusMatch;
  }) || [];

  const executionStats = {
    total: filteredExecutions.length,
    passed: filteredExecutions.filter(e => e.status === 'passed').length,
    failed: filteredExecutions.filter(e => e.status === 'failed').length,
    blocked: filteredExecutions.filter(e => e.status === 'blocked').length,
    skipped: filteredExecutions.filter(e => e.status === 'skipped').length,
    not_executed: (testCases?.length || 0) - filteredExecutions.length,
  };

  const recentExecutions = filteredExecutions
    .sort((a, b) => new Date(b.execution_date).getTime() - new Date(a.execution_date).getTime())
    .slice(0, 10);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-secondary" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-accent" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-secondary/15 text-secondary dark:bg-secondary/20';
      case 'failed':
        return 'bg-destructive/15 text-destructive dark:bg-destructive/20';
      case 'blocked':
        return 'bg-accent/15 text-accent-foreground dark:bg-accent/20';
      case 'skipped':
        return 'bg-primary/15 text-primary dark:bg-primary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Test Execution</h2>
          <p className="text-muted-foreground">
            Execute test cases and track results in real-time
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
          <Button className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Start Test Run
          </Button>
        </div>
      </div>

      {/* Execution Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executionStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{executionStats.passed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{executionStats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <AlertCircle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{executionStats.blocked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skipped</CardTitle>
            <SkipForward className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{executionStats.skipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Executed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{executionStats.not_executed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Executions</CardTitle>
          <CardDescription>
            Latest test execution results and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {executionsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentExecutions.length === 0 ? (
            <div className="text-center py-12">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Test Executions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start executing your test cases to see results here.
              </p>
              <Button className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Your First Test Run
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentExecutions.map((execution) => {
                const testCase = testCases?.find(tc => tc.id === execution.test_case_id);
                
                return (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(execution.status)}
                      <div>
                        <p className="font-medium">{testCase?.title || 'Unknown Test Case'}</p>
                        <p className="text-sm text-muted-foreground">
                          {execution.environment && `${execution.environment} • `}
                          {new Date(execution.execution_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                      {execution.execution_time && (
                        <span className="text-sm text-muted-foreground">
                          {execution.execution_time}min
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(execution.execution_date).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}