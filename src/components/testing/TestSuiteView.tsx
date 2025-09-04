import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestSuite, TestCase } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, TestTube, FileText, Bug, BarChart3 } from 'lucide-react';
import { TestCasesList } from './TestCasesList';
import { CreateTestCaseDialog } from './CreateTestCaseDialog';

interface TestSuiteViewProps {
  suiteId: string;
  projectId: string;
  onBack: () => void;
}

export function TestSuiteView({ suiteId, projectId, onBack }: TestSuiteViewProps) {
  const [showCreateCaseDialog, setShowCreateCaseDialog] = useState(false);

  const { data: suiteData, isLoading: suiteLoading } = useDataFetching<TestSuite>({
    table: 'test_suites' as any,
    filters: [{ column: 'id', value: suiteId, operator: 'eq' }],
    enabled: !!suiteId,
  });

  const suite = suiteData?.[0] || null;

  const { data: testCases } = useDataFetching<TestCase>({
    table: 'test_cases' as any,
    filters: [{ column: 'suite_id', value: suiteId, operator: 'eq' }],
    enabled: !!suiteId,
  });

  if (suiteLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!suite) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <p className="text-destructive">Test suite not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'functional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'regression':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'smoke':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'integration':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'performance':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'security':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Suite Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{suite.name}</h1>
            <Badge className={getTypeColor(suite.type)}>
              {suite.type}
            </Badge>
          </div>
          {suite.description && (
            <p className="text-muted-foreground max-w-2xl">{suite.description}</p>
          )}
        </div>
        <Button
          onClick={() => setShowCreateCaseDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Test Case
        </Button>
      </div>

      {/* Suite Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testCases?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total test cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executed</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Cases executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">
              Current pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defects</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Open defects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suite Content Tabs */}
      <Tabs defaultValue="testcases" className="space-y-6">
        <TabsList>
          <TabsTrigger value="testcases">Test Cases</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="defects">Defects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="testcases" className="space-y-6">
          <TestCasesList suiteId={suiteId} projectId={projectId} />
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Test Executions</h3>
              <p className="text-muted-foreground">
                View and track test execution history for this suite
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defects" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Defect Tracking</h3>
              <p className="text-muted-foreground">
                Manage defects found during test execution
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Suite Analytics</h3>
              <p className="text-muted-foreground">
                Detailed analytics and metrics for this test suite
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTestCaseDialog
        open={showCreateCaseDialog}
        onOpenChange={setShowCreateCaseDialog}
        suiteId={suiteId}
        projectId={projectId}
      />
    </div>
  );
}