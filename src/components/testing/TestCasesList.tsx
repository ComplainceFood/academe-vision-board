import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestCase, TestExecution } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, FileText, Clock, CheckCircle, XCircle, AlertCircle, SkipForward } from 'lucide-react';
import { CreateTestCaseDialog } from './CreateTestCaseDialog';
import { TestExecutionDialog } from './TestExecutionDialog';

interface TestCasesListProps {
  suiteId: string;
  projectId: string;
}

export function TestCasesList({ suiteId, projectId }: TestCasesListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);

  const { data: testCases, isLoading, refetch } = useDataFetching<TestCase>({
    table: 'test_cases' as any,
    filters: [{ column: 'suite_id', value: suiteId, operator: 'eq' }],
    enabled: !!suiteId
  });

  const { data: executions } = useDataFetching<TestExecution>({
    table: 'test_executions' as any,
    enabled: true
  });

  const getLatestExecution = (testCaseId: string) => {
    return executions?.find(exec => exec.test_case_id === testCaseId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'automated':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'api':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'ui':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'performance':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'security':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getStatusIcon = (execution?: TestExecution) => {
    if (!execution) {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
    
    switch (execution.status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleExecuteTest = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setShowExecutionDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!testCases || testCases.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Test Cases Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first test case to start testing this suite.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create First Test Case
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Test Cases</h3>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Test Case
        </Button>
      </div>

      <div className="space-y-4">
        {testCases.map((testCase) => {
          const latestExecution = getLatestExecution(testCase.id);
          
          return (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(latestExecution)}
                      <CardTitle className="text-lg">{testCase.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(testCase.priority)}>
                        {testCase.priority}
                      </Badge>
                      <Badge className={getTypeColor(testCase.type)}>
                        {testCase.type}
                      </Badge>
                      {testCase.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExecuteTest(testCase)}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Execute
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">
                  {testCase.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testCase.preconditions && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Preconditions:</h4>
                      <p className="text-sm">{testCase.preconditions}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Test Steps:</h4>
                    <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                      {testCase.test_steps.map((step, index) => (
                        <li key={index}>
                          <span className="ml-2">{step.action}</span>
                          {step.expected_result && (
                            <div className="ml-6 text-xs text-muted-foreground">
                              Expected: {step.expected_result}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {testCase.expected_result && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Expected Result:</h4>
                      <p className="text-sm">{testCase.expected_result}</p>
                    </div>
                  )}

                  {latestExecution && (
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground">Last Execution:</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Status: <Badge className="ml-1">{latestExecution.status}</Badge></span>
                        <span>Date: {new Date(latestExecution.execution_date).toLocaleDateString()}</span>
                        {latestExecution.execution_time && (
                          <span>Duration: {latestExecution.execution_time}min</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateTestCaseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        suiteId={suiteId}
        projectId={projectId}
        onSuccess={refetch}
      />

      {selectedTestCase && (
        <TestExecutionDialog
          open={showExecutionDialog}
          onOpenChange={setShowExecutionDialog}
          testCase={selectedTestCase}
          onSuccess={() => {
            refetch();
            setSelectedTestCase(null);
          }}
        />
      )}
    </div>
  );
}