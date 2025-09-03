import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestProject, TestSuite } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, TestTube, Bug, FileText, Settings } from 'lucide-react';
import { TestSuitesList } from './TestSuitesList';
import { CreateTestSuiteDialog } from './CreateTestSuiteDialog';

interface TestProjectViewProps {
  projectId: string;
  onBack: () => void;
}

export function TestProjectView({ projectId, onBack }: TestProjectViewProps) {
  const [showCreateSuiteDialog, setShowCreateSuiteDialog] = useState(false);

  const { data: projectData, isLoading: projectLoading } = useDataFetching<TestProject>({
    table: 'test_projects' as any,
    filters: [{ column: 'id', value: projectId, operator: 'eq' }],
    enabled: !!projectId,
  });

  const project = projectData?.[0] || null;

  const { data: suites, isLoading: suitesLoading } = useDataFetching<TestSuite>({
    table: 'test_suites' as any,
    filters: [{ column: 'project_id', value: projectId, operator: 'eq' }],
    enabled: !!projectId,
  });

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <p className="text-destructive">Project not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
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
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          )}
        </div>
        <Button
          onClick={() => setShowCreateSuiteDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Test Suite
        </Button>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Suites</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suites?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active test suites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total test cases
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">
              Current pass rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Content Tabs */}
      <Tabs defaultValue="suites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suites">Test Suites</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="suites" className="space-y-6">
          <TestSuitesList 
            projectId={projectId} 
            suites={suites} 
            isLoading={suitesLoading} 
          />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Requirements Management</h3>
              <p className="text-muted-foreground">
                Track and map requirements to test cases (Coming Soon)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <h3 className="text-lg font-semibold text-foreground mb-2">Team Management</h3>
              <p className="text-muted-foreground">
                Manage project team members and permissions (Coming Soon)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <h3 className="text-lg font-semibold text-foreground mb-2">Project Settings</h3>
              <p className="text-muted-foreground">
                Configure project settings and integrations (Coming Soon)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTestSuiteDialog
        open={showCreateSuiteDialog}
        onOpenChange={setShowCreateSuiteDialog}
        projectId={projectId}
      />
    </div>
  );
}