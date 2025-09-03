import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { TestProjectsDashboard } from '@/components/testing/TestProjectsDashboard';
import { TestProjectView } from '@/components/testing/TestProjectView';
import { TestExecutionDashboard } from '@/components/testing/TestExecutionDashboard';
import { TestAnalyticsDashboard } from '@/components/testing/TestAnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, BarChart3, Play, Settings } from 'lucide-react';

export default function TestingPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Testing Platform</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive test management, execution, and analytics platform
          </p>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Projects & Tests
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Test Execution
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics & Reports
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Test Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {!selectedProject ? (
              <TestProjectsDashboard onSelectProject={setSelectedProject} />
            ) : (
              <TestProjectView 
                projectId={selectedProject} 
                onBack={() => setSelectedProject(null)} 
              />
            )}
          </TabsContent>

          <TabsContent value="execution" className="space-y-6">
            <TestExecutionDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <TestAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-muted-foreground">
                Test Management Features Coming Soon
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Advanced test configuration, automation settings, and team management
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}