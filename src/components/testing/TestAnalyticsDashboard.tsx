import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, AlertTriangle } from 'lucide-react';

export function TestAnalyticsDashboard() {
  // Mock data for demonstration
  const analytics = {
    total_tests: 0,
    passed_tests: 0,
    failed_tests: 0,
    blocked_tests: 0,
    skipped_tests: 0,
    not_executed_tests: 0,
    pass_rate: 0,
    execution_trend: [],
    defect_summary: {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    },
    coverage_metrics: {
      requirements_covered: 0,
      total_requirements: 0,
      coverage_percentage: 0,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Test Analytics & Reports</h2>
        <p className="text-muted-foreground">
          Comprehensive insights into test execution, quality metrics, and trends
        </p>
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