import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useDataFetching } from "@/hooks/useDataFetching";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { AdminCommunication, COMMUNICATION_CATEGORIES, COMMUNICATION_PRIORITIES } from "@/types/communications";
import { format } from "date-fns";
import { Plus, Edit, Trash2, ShieldAlert, Send, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const communicationFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required").max(5000, "Content must be less than 5000 characters"),
  category: z.enum(COMMUNICATION_CATEGORIES),
  priority: z.enum(COMMUNICATION_PRIORITIES),
  is_published: z.boolean(),
  expires_at: z.string().optional()
});

type CommunicationFormData = z.infer<typeof communicationFormSchema>;

export function AdminCommunicationsManagement() {
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useUserRole();
  const [editingCommunication, setEditingCommunication] = useState<AdminCommunication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          You don't have permission to manage communications.
        </p>
      </div>
    );
  }

  const { data: communications, isLoading, refetch } = useDataFetching<AdminCommunication>({
    table: 'admin_communications',
    enabled: !!user
  });

  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
      priority: "normal",
      is_published: false,
      expires_at: ""
    }
  });

  const handleCreateOrUpdate = async (data: CommunicationFormData) => {
    if (!user) return;

    try {
      const communicationData: any = {
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority,
        is_published: data.is_published,
        admin_id: user.id,
        published_at: data.is_published ? new Date().toISOString() : null,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null
      };

      let result;
      if (editingCommunication) {
        result = await supabase
          .from('admin_communications')
          .update(communicationData)
          .eq('id', editingCommunication.id);
      } else {
        result = await supabase
          .from('admin_communications')
          .insert(communicationData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Communication ${editingCommunication ? 'updated' : 'created'} successfully`
      });

      form.reset();
      setEditingCommunication(null);
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save communication",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (communication: AdminCommunication) => {
    setEditingCommunication(communication);
    form.reset({
      title: communication.title,
      content: communication.content,
      category: communication.category as any,
      priority: communication.priority,
      is_published: communication.is_published,
      expires_at: communication.expires_at ? format(new Date(communication.expires_at), 'yyyy-MM-dd') : ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this communication?")) return;

    try {
      const { error } = await supabase
        .from('admin_communications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Communication deleted successfully"
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete communication",
        variant: "destructive"
      });
    }
  };

  const handlePublishToggle = async (communication: AdminCommunication) => {
    try {
      const { error } = await supabase
        .from('admin_communications')
        .update({
          is_published: !communication.is_published,
          published_at: !communication.is_published ? new Date().toISOString() : null
        })
        .eq('id', communication.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Communication ${!communication.is_published ? 'published' : 'unpublished'} successfully`
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update publication status",
        variant: "destructive"
      });
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

  return (
    <div className="space-y-6">
      {/* Header and Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Communications</h2>
          <p className="text-muted-foreground">Create and manage announcements for users</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCommunication(null);
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Communication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCommunication ? 'Edit Communication' : 'Create New Communication'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateOrUpdate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter communication title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter communication content"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMUNICATION_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMUNICATION_PRIORITIES.map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty if this communication should not expire
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Immediately</FormLabel>
                        <FormDescription>
                          Make this communication visible to all users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCommunication ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Communications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Communications</CardTitle>
          <CardDescription>
            Manage all communications sent to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : !communications || communications.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Communications</h3>
              <p className="text-muted-foreground">
                Create your first communication to reach out to users.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {communications.map((communication) => (
                <div
                  key={communication.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{communication.title}</h4>
                        <Badge variant={getPriorityVariant(communication.priority)}>
                          {communication.priority}
                        </Badge>
                        <Badge variant="outline">
                          {communication.category}
                        </Badge>
                        {communication.is_published && (
                          <Badge variant="default">
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {communication.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>Created {format(new Date(communication.created_at), 'MMM dd, yyyy')}</span>
                        {communication.published_at && (
                          <span>Published {format(new Date(communication.published_at), 'MMM dd, yyyy')}</span>
                        )}
                        {communication.expires_at && (
                          <span>Expires {format(new Date(communication.expires_at), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishToggle(communication)}
                      >
                        {communication.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(communication)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(communication.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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