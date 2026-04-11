import { useUserRole } from '@/hooks/useUserRole';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { AdminFeedbackManagement } from '@/components/feedback/AdminFeedbackManagement';
import { MessageSquare, Settings, Send } from 'lucide-react';

export default function FeedbackPage() {
  const { isSystemAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
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
                <MessageSquare className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Platform Feedback</h1>
                <p className="text-primary-foreground/80 text-lg mt-1">
                  Share your thoughts, suggestions, and bug reports to help us improve
                </p>
              </div>
            </div>
          </div>
        </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList className={`grid w-full ${isSystemAdmin() ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="submit" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Submit Feedback
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            My Feedback
          </TabsTrigger>
          {isSystemAdmin() && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Panel
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="submit" className="space-y-6">
          <FeedbackForm />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <FeedbackList />
        </TabsContent>

        {isSystemAdmin() && (
          <TabsContent value="admin" className="space-y-6">
            <AdminFeedbackManagement />
          </TabsContent>
        )}
      </Tabs>
      </div>
    </MainLayout>
  );
}