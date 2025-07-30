import { useDataFetching } from "@/hooks/useDataFetching";
import { AdminCommunication } from "@/types/communications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye, Users, TrendingUp, Calendar, MessageCircle, PieChart, BarChart3, Download } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CommunicationsAnalytics() {
  const [timeRange, setTimeRange] = useState<string>("30");
  const { data: communications, isLoading } = useDataFetching<AdminCommunication>({
    table: 'admin_communications',
    enabled: true
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const publishedCommunications = communications?.filter(c => c.is_published) || [];
  const unpublishedCommunications = communications?.filter(c => !c.is_published) || [];

  // Filter communications by time range
  const filterByTimeRange = (comms: AdminCommunication[]) => {
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return comms.filter(c => new Date(c.created_at) >= cutoffDate);
  };

  const recentCommunications = filterByTimeRange(communications || []);

  // Group communications by category
  const communicationsByCategory = (communications || []).reduce((acc, comm) => {
    acc[comm.category] = (acc[comm.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group communications by priority
  const communicationsByPriority = (communications || []).reduce((acc, comm) => {
    acc[comm.priority] = (acc[comm.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const exportData = () => {
    const dataToExport = communications?.map(comm => ({
      title: comm.title,
      description: comm.description || '',
      category: comm.category,
      priority: comm.priority,
      published: comm.is_published,
      created: format(new Date(comm.created_at), 'yyyy-MM-dd HH:mm'),
      published_date: comm.published_at ? format(new Date(comm.published_at), 'yyyy-MM-dd HH:mm') : '',
      expires: comm.expires_at ? format(new Date(comm.expires_at), 'yyyy-MM-dd HH:mm') : ''
    }));

    const csvContent = [
      Object.keys(dataToExport?.[0] || {}).join(','),
      ...(dataToExport || []).map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communications-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Communications Analytics</h2>
          <p className="text-muted-foreground">Track performance and engagement metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {recentCommunications.length} in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedCommunications.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((publishedCommunications.length / (communications?.length || 1)) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unpublishedCommunications.length}</div>
            <p className="text-xs text-muted-foreground">
              Unpublished communications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Period</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentCommunications.length}</div>
            <p className="text-xs text-muted-foreground">
              Communications in last {timeRange} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribution by Category
            </CardTitle>
            <CardDescription>Communications grouped by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(communicationsByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm font-medium">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribution by Priority
            </CardTitle>
            <CardDescription>Communications grouped by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(communicationsByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)} bg-current`}></div>
                    <span className="text-sm font-medium">
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Communications
          </CardTitle>
          <CardDescription>Latest communications in the selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCommunications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No communications found in the selected time period
            </div>
          ) : (
            <div className="space-y-3">
              {recentCommunications.slice(0, 10).map((comm) => (
                <div key={comm.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{comm.title}</h4>
                      <Badge 
                        variant={comm.is_published ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {comm.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {comm.category}
                      </Badge>
                    </div>
                    {comm.description && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {comm.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(comm.created_at), 'MMM dd, yyyy HH:mm')}
                      {comm.published_at && (
                        <> • Published {format(new Date(comm.published_at), 'MMM dd, yyyy HH:mm')}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        comm.priority === 'urgent' ? 'destructive' :
                        comm.priority === 'high' ? 'default' :
                        comm.priority === 'normal' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {comm.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}