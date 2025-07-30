import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useDataFetching } from '@/hooks/useDataFetching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { type Feedback, FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from '@/types/feedback';
import { format } from 'date-fns';
import { MessageSquare, Reply, Filter, BarChart3, ShieldAlert } from 'lucide-react';

const responseFormSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  admin_response: z.string().min(1, 'Response is required')
});

type ResponseFormData = z.infer<typeof responseFormSchema>;

export function AdminFeedbackManagement() {
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useUserRole();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // Security check - only system admins can access this component
  if (roleLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isSystemAdmin()) {
    return (
      <div className="p-8 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access the admin feedback management panel.
        </p>
      </div>
    );
  }

  const { data: allFeedback, isLoading, refetch } = useDataFetching<Feedback>({
    table: 'feedback',
    transform: (data) => data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  });

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      status: 'in_progress',
      admin_response: ''
    }
  });

  // Filter feedback based on selected filters
  const filteredFeedback = allFeedback?.filter(item => {
    const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    return statusMatch && categoryMatch;
  }) || [];

  // Statistics
  const stats = allFeedback ? {
    total: allFeedback.length,
    open: allFeedback.filter(f => f.status === 'open').length,
    inProgress: allFeedback.filter(f => f.status === 'in_progress').length,
    resolved: allFeedback.filter(f => f.status === 'resolved').length,
    highPriority: allFeedback.filter(f => f.priority === 'high' || f.priority === 'urgent').length
  } : { total: 0, open: 0, inProgress: 0, resolved: 0, highPriority: 0 };

  const getCategoryLabel = (value: string) => {
    return FEEDBACK_CATEGORIES.find(cat => cat.value === value)?.label || value;
  };

  const getPriorityInfo = (value: string) => {
    return FEEDBACK_PRIORITIES.find(p => p.value === value) || { label: value, color: 'text-gray-600' };
  };

  const getStatusInfo = (value: string) => {
    return FEEDBACK_STATUSES.find(s => s.value === value) || { label: value, color: 'text-gray-600' };
  };

  const onSubmitResponse = async (data: ResponseFormData) => {
    if (!user || !respondingTo) return;

    try {
      const updateData: any = {
        status: data.status,
        admin_response: data.admin_response,
        admin_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (data.status === 'resolved' || data.status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('feedback')
        .update(updateData)
        .eq('id', respondingTo);

      if (error) throw error;

      toast({
        title: 'Response submitted successfully',
        description: 'The feedback has been updated with your response.'
      });

      setRespondingTo(null);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error submitting response',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feedback Management</h2>
          <p className="text-muted-foreground">Manage and respond to user feedback</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquare className="mr-2 h-4 w-4" />
            All Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="flex gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {FEEDBACK_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FEEDBACK_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {filteredFeedback.map((item) => {
                const priorityInfo = getPriorityInfo(item.priority);
                const statusInfo = getStatusInfo(item.status);
                
                return (
                  <Card key={item.id} className="transition-shadow hover:shadow-md">
                    <CardHeader>
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
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.description}
                      </p>
                      
                      {item.admin_response ? (
                        <div className="bg-muted/50 p-3 rounded-lg mb-4">
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
                      ) : null}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setRespondingTo(item.id)}
                          >
                            <Reply className="mr-2 h-4 w-4" />
                            {item.admin_response ? 'Update Response' : 'Respond'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Respond to Feedback</DialogTitle>
                            <DialogDescription>
                              Provide a response and update the status of this feedback.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitResponse)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {FEEDBACK_STATUSES.map((status) => (
                                          <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="admin_response"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Response</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Provide your response to the user..."
                                        className="min-h-[100px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Button type="submit" className="w-full">
                                Submit Response
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}