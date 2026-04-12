import React from 'react';
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
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Suite name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['functional', 'regression', 'smoke', 'integration', 'performance', 'security']).default('functional'),
});

interface CreateTestSuiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateTestSuiteDialog({ open, onOpenChange, projectId }: CreateTestSuiteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'functional',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a test suite',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('test_suites')
        .insert({
          name: values.name,
          description: values.description || null,
          type: values.type,
          project_id: projectId,
          user_id: user.id,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Test suite created successfully',
      });

      form.reset();
      onOpenChange(false);
      
      // Trigger a refresh of the suites list
      window.dispatchEvent(new CustomEvent('refreshData'));
    } catch (error: any) {
      console.error('Error creating test suite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test suite',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Test Suite</DialogTitle>
          <DialogDescription>
            Create a test suite to organize related test cases.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suite Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., User Authentication Tests" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this test suite covers..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suite Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select suite type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="regression">Regression</SelectItem>
                      <SelectItem value="smoke">Smoke</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex items-center gap-2"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Suite
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}