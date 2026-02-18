import { MainLayout } from "@/components/MainLayout";
import { CommunicationsList } from "@/components/communications/CommunicationsList";
import { AdminCommunicationsManagement } from "@/components/communications/AdminCommunicationsManagement";
import { CommunicationsAnalytics } from "@/components/communications/CommunicationsAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { MessageSquare, Settings, Megaphone } from "lucide-react";

export default function CommunicationsPage() {
  const { isSystemAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

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
                <Megaphone className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Admin Communications</h1>
                <p className="text-primary-foreground/80 text-lg mt-1">
                  Stay updated with administrative announcements and platform updates
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className={`p-1.5 bg-muted/70 backdrop-blur-sm rounded-xl ${isSystemAdmin() ? 'grid grid-cols-3 w-full max-w-2xl' : 'inline-flex'}`}>
            <TabsTrigger value="announcements" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <MessageSquare className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            {isSystemAdmin() && (
              <>
                <TabsTrigger value="admin" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <Settings className="h-4 w-4" />
                  Manage
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <Megaphone className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="announcements" className="space-y-6">
            <CommunicationsList />
          </TabsContent>

          {isSystemAdmin() && (
            <>
              <TabsContent value="admin" className="space-y-6">
                <AdminCommunicationsManagement />
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <CommunicationsAnalytics />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}