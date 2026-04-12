import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TestStep } from '@/types/testing';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X } from 'lucide-react';

const testStepSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  expected_result: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  preconditions: z.string().max(500, 'Preconditions too long').optional(),
  test_steps: z.array(testStepSchema).min(1, 'At least one test step is required'),
  expected_result: z.string().max(1000, 'Expected result too long').optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  type: z.enum(['manual', 'automated', 'api', 'ui', 'performance', 'security']).default('manual'),
  tags: z.string().optional(),
  estimated_time: z.number().min(0).optional(),
});

interface CreateTestCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suiteId: string;
  projectId: string;
  onSuccess?: () => void;
}

export function CreateTestCaseDialog({ 
  open, 
  onOpenChange, 
  suiteId, 
  projectId, 
  onSuccess 
}: CreateTestCaseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      preconditions: '',
      test_steps: [{ action: '', expected_result: '' }],
      expected_result: '',
      priority: 'medium',
      type: 'manual',
      tags: '',
      estimated_time: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'test_steps',
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a test case',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tags = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const testSteps: TestStep[] = values.test_steps.map((step, index) => ({
        step: index + 1,
        action: step.action,
        expected_result: step.expected_result || undefined,
      }));

      const { error } = await supabase
        .from('test_cases')
        .insert({
          suite_id: suiteId,
          user_id: user.id,
          title: values.title,
          description: values.description || null,
          preconditions: values.preconditions || null,
          test_steps: testSteps as any,
          expected_result: values.expected_result || null,
          priority: values.priority,
          type: values.type,
          tags: tags,
          status: 'active',
          estimated_time: values.estimated_time || null,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Test case created successfully',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating test case:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test case',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Test Case</DialogTitle>
          <DialogDescription>
            Define a new test case with detailed steps and expected results.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Case Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Login with valid credentials" 
                        {...field} 
                      />
                    </FormControl>
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
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automated">Automated</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="ui">UI</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 15"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this test case validates..."
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
              name="preconditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preconditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any setup or conditions required before executing this test..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Test Steps</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ action: '', expected_result: '' })}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Step
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Step {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`test_steps.${index}.action`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the action to perform..."
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`test_steps.${index}.expected_result`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Result (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What should happen after this action..."
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="expected_result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Expected Result</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the overall expected outcome of this test case..."
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., login, authentication, critical-path"
                      {...field} 
                    />
                  </FormControl>
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
                Create Test Case
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}