import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestProject, TestRequirement, TestCase, TestExecution, TestDefect } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Users, 
  FileText, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Search,
  Filter,
  Download,
  Upload,
  Plus
} from 'lucide-react';
import { CreateRequirementDialog } from './CreateRequirementDialog';
import { RequirementsList } from './RequirementsList';
import { TestCoverageMatrix } from './TestCoverageMatrix';
import { DefectManagement } from './DefectManagement';

export function TestManagementDashboard() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('requirements');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRequirement, setShowCreateRequirement] = useState(false);

  const { data: projects } = useDataFetching<TestProject>({
    table: 'test_projects' as any,
    enabled: true
  });

  const { data: requirements } = useDataFetching<TestRequirement>({
    table: 'test_requirements' as any,
    enabled: true
  });

  const { data: testCases } = useDataFetching<TestCase>({
    table: 'test_cases' as any,
    enabled: true
  });

  const { data: executions } = useDataFetching<TestExecution>({
    table: 'test_executions' as any,
    enabled: true
  });

  const { data: defects } = useDataFetching<TestDefect>({
    table: 'test_defects' as any,
    enabled: true
  });

  // Filter data based on selected project
  const filteredRequirements = requirements?.filter(req => 
    selectedProject === 'all' || req.project_id === selectedProject
  ) || [];

  const filteredDefects = defects?.filter(defect => {
    // Filter defects by project through executions -> test cases
    if (selectedProject === 'all') return true;
    const execution = executions?.find(e => e.id === defect.execution_id);
    if (!execution) return false;
    const testCase = testCases?.find(tc => tc.id === execution.test_case_id);
    // Would need to join with suites to get project_id
    return true; // Simplified for now
  }) || [];

  // Calculate management metrics
  const managementMetrics = {
    total_requirements: filteredRequirements.length,
    covered_requirements: 0, // Would calculate based on requirement-test case mapping
    coverage_percentage: 0,
    active_defects: filteredDefects.filter(d => d.status === 'open').length,
    critical_defects: filteredDefects.filter(d => d.severity === 'critical').length,
    high_priority_requirements: filteredRequirements.filter(r => r.priority === 'high').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Test Management</h2>
          <p className="text-muted-foreground">
            Manage requirements, test coverage, defects, and team configuration
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
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Management Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementMetrics.total_requirements}</div>
            <p className="text-xs text-muted-foreground">
              {managementMetrics.high_priority_requirements} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementMetrics.coverage_percentage}%</div>
            <Progress value={managementMetrics.coverage_percentage} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Requirements covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Defects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managementMetrics.active_defects}</div>
            <p className="text-xs text-muted-foreground">
              {managementMetrics.critical_defects} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requirements
          </TabsTrigger>
          <TabsTrigger value="coverage" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Coverage Matrix
          </TabsTrigger>
          <TabsTrigger value="defects" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Defect Management
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Requirements Management</CardTitle>
                  <CardDescription>
                    Manage test requirements and track their implementation status
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowCreateRequirement(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requirements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <RequirementsList 
                projectId={selectedProject}
                searchTerm={searchTerm}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Coverage Matrix</CardTitle>
              <CardDescription>
                View the mapping between requirements and test cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestCoverageMatrix projectId={selectedProject} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Defect Management</CardTitle>
              <CardDescription>
                Track and manage defects found during test execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DefectManagement projectId={selectedProject} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Environment Configuration</CardTitle>
                <CardDescription>
                  Configure test environments and automation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Environment</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dev">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="prod">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Browser Configuration</label>
                  <Select>
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
                <Button className="w-full">Save Configuration</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>
                  Configure test automation frameworks and CI/CD integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Framework</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selenium">Selenium</SelectItem>
                      <SelectItem value="cypress">Cypress</SelectItem>
                      <SelectItem value="playwright">Playwright</SelectItem>
                      <SelectItem value="jest">Jest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CI/CD Integration</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CI/CD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub Actions</SelectItem>
                      <SelectItem value="gitlab">GitLab CI</SelectItem>
                      <SelectItem value="jenkins">Jenkins</SelectItem>
                      <SelectItem value="azure">Azure DevOps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Configure Automation</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CreateRequirementDialog
        open={showCreateRequirement}
        onOpenChange={setShowCreateRequirement}
        projectId={selectedProject}
      />
    </div>
  );
}