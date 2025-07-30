import { useDataFetching } from '@/hooks/useDataFetching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Feedback, FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from '@/types/feedback';
import { format } from 'date-fns';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function FeedbackList() {
  const { data: feedback, isLoading } = useDataFetching<Feedback>({
    table: 'feedback',
    transform: (data) => data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  });

  const getCategoryLabel = (value: string) => {
    return FEEDBACK_CATEGORIES.find(cat => cat.value === value)?.label || value;
  };

  const getPriorityInfo = (value: string) => {
    return FEEDBACK_PRIORITIES.find(p => p.value === value) || { label: value, color: 'text-gray-600' };
  };

  const getStatusInfo = (value: string) => {
    return FEEDBACK_STATUSES.find(s => s.value === value) || { label: value, color: 'text-gray-600' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">No feedback submitted yet</CardTitle>
          <CardDescription>
            Your submitted feedback will appear here. Use the form above to share your thoughts!
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Your Feedback History</h3>
        <Badge variant="secondary">{feedback.length}</Badge>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {feedback.map((item) => {
            const priorityInfo = getPriorityInfo(item.priority);
            const statusInfo = getStatusInfo(item.status);
            
            return (
              <Card key={item.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{item.subject}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getCategoryLabel(item.category)}</span>
                        <span>•</span>
                        <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <Badge variant="outline" className={priorityInfo.color}>
                        {priorityInfo.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {item.description}
                  </p>
                  
                  {item.admin_response && (
                    <>
                      <Separator className="my-3" />
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">Admin Response</Badge>
                          {item.resolved_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.resolved_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{item.admin_response}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}