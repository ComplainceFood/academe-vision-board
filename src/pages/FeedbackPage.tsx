import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { AdminFeedbackManagement } from '@/components/feedback/AdminFeedbackManagement';
import { MessageSquare, Settings, Send } from 'lucide-react';

export default function FeedbackPage() {
  const { isAdmin, loading } = useUserRole();

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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Feedback Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Share your thoughts, suggestions, and bug reports to help us improve the platform.
          Your feedback is valuable to us!
        </p>
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submit" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Submit Feedback
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            My Feedback
          </TabsTrigger>
          {isAdmin && (
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

        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <AdminFeedbackManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}