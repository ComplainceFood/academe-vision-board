import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestRequirement, TestCase, TestSuite } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Target, 
  CheckCircle, 
  XCircle, 
  Link,
  Plus,
  AlertTriangle
} from 'lucide-react';

interface TestCoverageMatrixProps {
  projectId: string;
}

export function TestCoverageMatrix({ projectId }: TestCoverageMatrixProps) {
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);

  const { data: requirements } = useDataFetching<TestRequirement>({
    table: 'test_requirements' as any,
    enabled: true
  });

  const { data: testCases } = useDataFetching<TestCase>({
    table: 'test_cases' as any,
    enabled: true
  });

  const { data: testSuites } = useDataFetching<TestSuite>({
    table: 'test_suites' as any,
    enabled: true
  });

  // Filter requirements by project
  const filteredRequirements = requirements?.filter(req => 
    projectId === 'all' || req.project_id === projectId
  ) || [];

  // For demonstration purposes, we'll create mock coverage data
  // In a real application, you'd have a mapping table between requirements and test cases
  const generateMockCoverage = () => {
    const coverage: Record<string, string[]> = {};
    filteredRequirements.forEach(req => {
      // Randomly assign some test cases to requirements for demo
      const assignedCases = testCases?.filter(() => Math.random() > 0.7) || [];
      coverage[req.id] = assignedCases.map(tc => tc.id);
    });
    return coverage;
  };

  const [requirementTestCaseMapping] = useState(generateMockCoverage());

  // Calculate coverage statistics
  const coverageStats = {
    total_requirements: filteredRequirements.length,
    covered_requirements: Object.values(requirementTestCaseMapping).filter(cases => cases.length > 0).length,
    coverage_percentage: filteredRequirements.length > 0 
      ? Math.round((Object.values(requirementTestCaseMapping).filter(cases => cases.length > 0).length / filteredRequirements.length) * 100)
      : 0,
    total_test_cases: testCases?.length || 0,
    linked_test_cases: Object.values(requirementTestCaseMapping).flat().length,
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
      case 'functional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'performance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'security':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'usability':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'non_functional':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Coverage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverageStats.coverage_percentage}%</div>
            <Progress value={coverageStats.coverage_percentage} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {coverageStats.covered_requirements} of {coverageStats.total_requirements} requirements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Covered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{coverageStats.covered_requirements}</div>
            <p className="text-xs text-muted-foreground">Requirements with tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uncovered</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {coverageStats.total_requirements - coverageStats.covered_requirements}
            </div>
            <p className="text-xs text-muted-foreground">Requirements without tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coverageStats.linked_test_cases}</div>
            <p className="text-xs text-muted-foreground">Total test case links</p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements-Test Case Matrix</CardTitle>
          <CardDescription>
            View which test cases are linked to each requirement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Requirements Available</h3>
              <p className="text-muted-foreground">
                Create requirements first to track test coverage.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Requirement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Test Cases</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.map((requirement) => {
                    const linkedCases = requirementTestCaseMapping[requirement.id] || [];
                    const linkedTestCases = testCases?.filter(tc => linkedCases.includes(tc.id)) || [];
                    const isCovered = linkedCases.length > 0;

                    return (
                      <TableRow 
                        key={requirement.id}
                        className={selectedRequirement === requirement.id ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{requirement.title}</div>
                            {requirement.external_id && (
                              <div className="text-sm text-muted-foreground">
                                {requirement.external_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(requirement.type)}>
                            {requirement.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(requirement.priority)}>
                            {requirement.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {requirement.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {linkedTestCases.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No test cases linked</span>
                            ) : (
                              linkedTestCases.slice(0, 2).map((testCase) => (
                                <div key={testCase.id} className="text-sm">
                                  {testCase.title}
                                </div>
                              ))
                            )}
                            {linkedTestCases.length > 2 && (
                              <div className="text-sm text-muted-foreground">
                                +{linkedTestCases.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isCovered ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            )}
                            <span className={isCovered ? 'text-green-600' : 'text-orange-600'}>
                              {isCovered ? 'Covered' : 'Not Covered'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequirement(
                                selectedRequirement === requirement.id ? null : requirement.id
                              )}
                            >
                              <Link className="h-4 w-4 mr-1" />
                              Link Tests
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coverage Gaps Alert */}
      {coverageStats.coverage_percentage < 80 && filteredRequirements.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800 dark:text-orange-200">Coverage Gap Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 dark:text-orange-300 mb-4">
              Your test coverage is below the recommended 80% threshold. Consider creating test cases 
              for uncovered requirements to improve quality assurance.
            </p>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Missing Test Cases
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}