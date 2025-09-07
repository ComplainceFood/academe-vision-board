import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  type: z.enum(['functional', 'non_functional', 'performance', 'security', 'usability']).default('functional'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['draft', 'approved', 'implemented', 'tested']).default('draft'),
  external_id: z.string().max(50, 'External ID too long').optional(),
});

interface CreateRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function CreateRequirementDialog({ 
  open, 
  onOpenChange, 
  projectId,
  onSuccess 
}: CreateRequirementDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'functional',
      priority: 'medium',
      status: 'draft',
      external_id: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create requirements.",
        variant: "destructive",
      });
      return;
    }

    if (projectId === 'all') {
      toast({
        title: "Project required",
        description: "Please select a specific project to create requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requirementData = {
        title: values.title,
        description: values.description || null,
        type: values.type,
        priority: values.priority,
        status: values.status,
        external_id: values.external_id || null,
        project_id: projectId,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('test_requirements')
        .insert([requirementData]);

      if (error) throw error;

      toast({
        title: "Requirement created",
        description: "Test requirement has been created successfully.",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating requirement:', error);
      toast({
        title: "Error",
        description: "Failed to create requirement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'functional':
        return 'text-blue-600';
      case 'performance':
        return 'text-purple-600';
      case 'security':
        return 'text-red-600';
      case 'usability':
        return 'text-green-600';
      case 'non_functional':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Test Requirement</DialogTitle>
          <DialogDescription>
            Add a new requirement to track and manage test coverage
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Requirement title"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_id">External ID</Label>
              <Input
                id="external_id"
                placeholder="REQ-001"
                {...form.register('external_id')}
              />
              {form.formState.errors.external_id && (
                <p className="text-sm text-red-600">{form.formState.errors.external_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the requirement..."
              className="min-h-[100px]"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={form.watch('type')} 
                onValueChange={(value) => form.setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">
                    <span className={getTypeColor('functional')}>Functional</span>
                  </SelectItem>
                  <SelectItem value="non_functional">
                    <span className={getTypeColor('non_functional')}>Non-Functional</span>
                  </SelectItem>
                  <SelectItem value="performance">
                    <span className={getTypeColor('performance')}>Performance</span>
                  </SelectItem>
                  <SelectItem value="security">
                    <span className={getTypeColor('security')}>Security</span>
                  </SelectItem>
                  <SelectItem value="usability">
                    <span className={getTypeColor('usability')}>Usability</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={form.watch('priority')} 
                onValueChange={(value) => form.setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">
                    <span className={getPriorityColor('critical')}>Critical</span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className={getPriorityColor('high')}>High</span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className={getPriorityColor('medium')}>Medium</span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className={getPriorityColor('low')}>Low</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={form.watch('status')} 
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="tested">Tested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Requirement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}