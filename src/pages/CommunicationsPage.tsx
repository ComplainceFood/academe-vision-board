import { MainLayout } from "@/components/MainLayout";
import { CommunicationsList } from "@/components/communications/CommunicationsList";
import { AdminCommunicationsManagement } from "@/components/communications/AdminCommunicationsManagement";
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
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Academic Communications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with departmental announcements and academic notices
          </p>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className={`grid w-full ${isSystemAdmin() ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            {isSystemAdmin() && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Communications
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="announcements" className="space-y-6">
            <CommunicationsList />
          </TabsContent>

          {isSystemAdmin() && (
            <TabsContent value="admin" className="space-y-6">
              <AdminCommunicationsManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}