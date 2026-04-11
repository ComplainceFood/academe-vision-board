import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestProject, TestSuite, TestCase } from '@/types/testing';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  SkipForward,
  Loader2
} from 'lucide-react';

interface TestRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  suiteId?: string;
}

export function TestRunDialog({ open, onOpenChange, projectId, suiteId }: TestRunDialogProps) {
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedBrowser, setSelectedBrowser] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  const { data: projects } = useDataFetching<TestProject>({
    table: 'test_projects' as any,
    enabled: true
  });

  const { data: testSuites } = useDataFetching<TestSuite>({
    table: 'test_suites' as any,
    enabled: true
  });

  const { data: testCases } = useDataFetching<TestCase>({
    table: 'test_cases' as any,
    enabled: true
  });

  // Filter suites by project if specified
  const availableSuites = testSuites?.filter(suite => 
    !projectId || suite.project_id === projectId
  ) || [];

  const handleSuiteToggle = (suiteId: string) => {
    setSelectedSuites(prev => 
      prev.includes(suiteId) 
        ? prev.filter(id => id !== suiteId)
        : [...prev, suiteId]
    );
  };

  const handleStartTestRun = async () => {
    if (selectedSuites.length === 0) return;

    setIsRunning(true);
    setRunProgress(0);
    setExecutionResults([]);

    // Simulate test execution
    const totalTests = testCases?.filter(tc => 
      selectedSuites.some(suiteId => tc.suite_id === suiteId)
    ).length || 0;

    for (let i = 0; i < totalTests; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate test execution time
      
      const progress = ((i + 1) / totalTests) * 100;
      setRunProgress(progress);

      // Simulate random test results
      const result = {
        id: i,
        testName: `Test Case ${i + 1}`,
        status: Math.random() > 0.2 ? 'passed' : Math.random() > 0.5 ? 'failed' : 'skipped',
        duration: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
        environment: selectedEnvironment,
        browser: selectedBrowser,
      };

      setExecutionResults(prev => [...prev, result]);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'skipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const resultsStats = {
    total: executionResults.length,
    passed: executionResults.filter(r => r.status === 'passed').length,
    failed: executionResults.filter(r => r.status === 'failed').length,
    skipped: executionResults.filter(r => r.status === 'skipped').length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start Test Run</DialogTitle>
          <DialogDescription>
            Configure and execute a test run with selected test suites
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isRunning && executionResults.length === 0 && (
            <>
              {/* Configuration Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Test Environment</h4>
                    <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Browser</h4>
                    <Select value={selectedBrowser} onValueChange={setSelectedBrowser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select browser" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chrome">Chrome</SelectItem>
                        <SelectItem value="firefox">Firefox</SelectItem>
                        <SelectItem value="safari">Safari</SelectItem>
                        <SelectItem value="edge">Edge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Test Suites</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {availableSuites.map((suite) => {
                        const suiteTestCases = testCases?.filter(tc => tc.suite_id === suite.id) || [];
                        return (
                          <div key={suite.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={suite.id}
                              checked={selectedSuites.includes(suite.id)}
                              onCheckedChange={() => handleSuiteToggle(suite.id)}
                            />
                            <label
                              htmlFor={suite.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {suite.name} ({suiteTestCases.length} tests)
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartTestRun}
                  disabled={selectedSuites.length === 0 || !selectedEnvironment || !selectedBrowser}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Test Run
                </Button>
              </div>
            </>
          )}

          {/* Execution Progress */}
          {isRunning && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-medium mb-2">Running Tests...</h4>
                <Progress value={runProgress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(runProgress)}% complete
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold">{resultsStats.total}</div>
                  <p className="text-sm text-muted-foreground">Executed</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{resultsStats.passed}</div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{resultsStats.failed}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{resultsStats.skipped}</div>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </div>

              {/* Real-time Results */}
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {executionResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.testName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {(result.duration / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Results */}
          {!isRunning && executionResults.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-medium mb-4">Test Run Complete</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold">{resultsStats.total}</div>
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{resultsStats.passed}</div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{resultsStats.failed}</div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{resultsStats.skipped}</div>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </div>
                </div>

                <div className="mt-4">
                  <Progress value={(resultsStats.passed / resultsStats.total) * 100} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Pass Rate: {Math.round((resultsStats.passed / resultsStats.total) * 100)}%
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setExecutionResults([]);
                    setRunProgress(0);
                  }}
                >
                  Run Again
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}