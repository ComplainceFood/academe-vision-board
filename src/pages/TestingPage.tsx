import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { TestProjectsDashboard } from '@/components/testing/TestProjectsDashboard';
import { TestProjectView } from '@/components/testing/TestProjectView';
import { TestExecutionDashboard } from '@/components/testing/TestExecutionDashboard';
import { TestAnalyticsDashboard } from '@/components/testing/TestAnalyticsDashboard';
import { TestManagementDashboard } from '@/components/testing/TestManagementDashboard';
import { AdminSeedDataManager } from '@/components/admin/AdminSeedDataManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, BarChart3, Play, Settings, ShieldCheck } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export default function TestingPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { isSystemAdmin, loading: roleLoading } = useUserRole();

  const showAdminPanel = !roleLoading && isSystemAdmin();

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
                <TestTube className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Testing Platform</h1>
                <p className="text-primary-foreground/80 text-lg mt-1">
                  Comprehensive test management, execution, and analytics platform
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className={`grid w-full ${showAdminPanel ? 'grid-cols-5' : 'grid-cols-4'}`}>
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
            {showAdminPanel && (
              <TabsTrigger value="admin-panel" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </TabsTrigger>
            )}
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
            <TestManagementDashboard />
          </TabsContent>

          {showAdminPanel && (
            <TabsContent value="admin-panel" className="space-y-6">
              <AdminSeedDataManager />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
