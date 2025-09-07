import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestAutomationConfig, TestProject, TestCase, TestExecution } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle,
  Code,
  Cog,
  Terminal,
  PlayCircle,
  StopCircle,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

export function TestAutomationDashboard() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedFramework, setSelectedFramework] = useState<string>('selenium');
  const [automationStatus, setAutomationStatus] = useState<'idle' | 'running' | 'stopped'>('idle');

  const { data: projects } = useDataFetching<TestProject>({
    table: 'test_projects' as any,
    enabled: true
  });

  const { data: automationConfigs } = useDataFetching<TestAutomationConfig>({
    table: 'test_automation_configs' as any,
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

  // Filter automation configs by project
  const filteredConfigs = automationConfigs?.filter(config => 
    selectedProject === 'all' || 
    testCases?.find(tc => tc.id === config.test_case_id)
  ) || [];

  // Calculate automation metrics
  const automationMetrics = {
    total_test_cases: testCases?.length || 0,
    automated_test_cases: filteredConfigs.filter(c => c.is_active).length,
    automation_percentage: testCases?.length > 0 
      ? Math.round((filteredConfigs.filter(c => c.is_active).length / testCases.length) * 100)
      : 0,
    last_execution: executions?.length > 0 
      ? new Date(Math.max(...executions.map(e => new Date(e.execution_date).getTime())))
      : null,
    active_frameworks: [...new Set(filteredConfigs.map(c => c.framework))],
  };

  const handleStartAutomation = () => {
    setAutomationStatus('running');
    // In a real implementation, this would trigger the automation framework
    setTimeout(() => {
      setAutomationStatus('idle');
    }, 5000);
  };

  const handleStopAutomation = () => {
    setAutomationStatus('stopped');
    setTimeout(() => {
      setAutomationStatus('idle');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Test Automation</h2>
          <p className="text-muted-foreground">
            Configure and manage automated test execution
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Config
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Config
          </Button>
        </div>
      </div>

      {/* Automation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationMetrics.automation_percentage}%</div>
            <Progress value={automationMetrics.automation_percentage} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {automationMetrics.automated_test_cases} of {automationMetrics.total_test_cases} tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automated Tests</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationMetrics.automated_test_cases}</div>
            <p className="text-xs text-muted-foreground">
              Active configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frameworks</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationMetrics.active_frameworks.length}</div>
            <p className="text-xs text-muted-foreground">
              Active frameworks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automationMetrics.last_execution 
                ? automationMetrics.last_execution.toLocaleDateString()
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Last automation run
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Automation Control</CardTitle>
            <CardDescription>
              Start, stop, and monitor automated test execution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${
                  automationStatus === 'running' ? 'bg-green-500 animate-pulse' :
                  automationStatus === 'stopped' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium">Automation Status</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {automationStatus === 'running' ? 'Running tests...' : 
                     automationStatus === 'stopped' ? 'Stopped' : 'Ready to run'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {automationStatus === 'idle' && (
                  <Button 
                    onClick={handleStartAutomation}
                    className="flex items-center gap-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start Tests
                  </Button>
                )}
                {automationStatus === 'running' && (
                  <Button 
                    onClick={handleStopAutomation}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <StopCircle className="h-4 w-4" />
                    Stop Tests
                  </Button>
                )}
                {automationStatus === 'stopped' && (
                  <Button 
                    onClick={() => setAutomationStatus('idle')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Test Suite Selection</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select test suite to run" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Test Suites</SelectItem>
                  <SelectItem value="smoke">Smoke Tests</SelectItem>
                  <SelectItem value="regression">Regression Tests</SelectItem>
                  <SelectItem value="critical">Critical Path Tests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Environment</Label>
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
              <Label>Browser Configuration</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select browser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chrome">Chrome</SelectItem>
                  <SelectItem value="firefox">Firefox</SelectItem>
                  <SelectItem value="safari">Safari</SelectItem>
                  <SelectItem value="edge">Edge</SelectItem>
                  <SelectItem value="headless">Headless Chrome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Framework Configuration</CardTitle>
            <CardDescription>
              Configure automation frameworks and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Automation Framework</Label>
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selenium">Selenium WebDriver</SelectItem>
                  <SelectItem value="cypress">Cypress</SelectItem>
                  <SelectItem value="playwright">Playwright</SelectItem>
                  <SelectItem value="jest">Jest</SelectItem>
                  <SelectItem value="puppeteer">Puppeteer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Configuration Script</Label>
              <Textarea
                placeholder="Enter framework configuration script..."
                className="min-h-[120px] font-mono text-sm"
                defaultValue={`// ${selectedFramework} configuration
const config = {
  baseUrl: 'https://your-app.com',
  timeout: 30000,
  retries: 2,
  headless: true
};

module.exports = config;`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timeout (ms)</Label>
                <Input type="number" placeholder="30000" />
              </div>
              <div className="space-y-2">
                <Label>Retries</Label>
                <Input type="number" placeholder="2" />
              </div>
            </div>

            <Button className="w-full flex items-center gap-2">
              <Cog className="h-4 w-4" />
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Automation Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Automation Runs</CardTitle>
          <CardDescription>
            History of automated test executions and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 1, suite: 'Smoke Tests', status: 'passed', duration: '2m 34s', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
              { id: 2, suite: 'Regression Tests', status: 'failed', duration: '15m 22s', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
              { id: 3, suite: 'Critical Path', status: 'passed', duration: '5m 18s', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) },
            ].map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {run.status === 'passed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{run.suite}</p>
                    <p className="text-sm text-muted-foreground">
                      {run.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={run.status === 'passed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }>
                    {run.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {run.duration}
                  </span>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}