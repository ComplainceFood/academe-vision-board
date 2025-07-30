import { useDataFetching } from "@/hooks/useDataFetching";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminCommunication } from "@/types/communications";
import { format } from "date-fns";
import { Megaphone, AlertTriangle, Info, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CommunicationsList() {
  const { data: communications, isLoading } = useDataFetching<AdminCommunication>({
    table: 'admin_communications',
    enabled: true
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <CheckCircle className="h-4 w-4 text-orange-500" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive' as const;
      case 'high':
        return 'default' as const;
      case 'normal':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'features':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'security':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'updates':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'announcements':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!communications || communications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Megaphone className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Communications Yet</h3>
          <p className="text-muted-foreground text-center mb-6">
            There are no announcements or communications available at the moment.
            Check back later for updates.
          </p>
          <Button variant="outline" asChild>
            <Link to="/feedback">Have feedback? Let us know</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {communications.map((communication) => (
        <Card key={communication.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getPriorityIcon(communication.priority)}
                <h3 className="text-lg font-semibold">{communication.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityVariant(communication.priority)}>
                  {communication.priority}
                </Badge>
                <Badge className={getCategoryColor(communication.category)}>
                  {communication.category}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {communication.published_at && (
                <span>
                  Published {format(new Date(communication.published_at), 'MMM dd, yyyy')}
                </span>
              )}
              {communication.expires_at && (
                <span>
                  Expires {format(new Date(communication.expires_at), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{communication.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}