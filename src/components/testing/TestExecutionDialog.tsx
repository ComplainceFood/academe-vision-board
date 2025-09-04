import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TestCase } from '@/types/testing';
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
import { Loader2, Play, CheckCircle, XCircle, AlertCircle, SkipForward } from 'lucide-react';

const formSchema = z.object({
  status: z.enum(['passed', 'failed', 'blocked', 'skipped']),
  actual_result: z.string().optional(),
  execution_time: z.number().min(0).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  environment: z.string().max(100, 'Environment name too long').optional(),
  browser: z.string().max(50, 'Browser name too long').optional(),
  build_version: z.string().max(50, 'Build version too long').optional(),
});

interface TestExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testCase: TestCase;
  onSuccess?: () => void;
}

export function TestExecutionDialog({ 
  open, 
  onOpenChange, 
  testCase, 
  onSuccess 
}: TestExecutionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'passed',
      actual_result: '',
      execution_time: undefined,
      notes: '',
      environment: '',
      browser: '',
      build_version: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to execute a test',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    try {
      const { error } = await supabase
        .from('test_executions')
        .insert({
          test_case_id: testCase.id,
          user_id: user.id,
          status: values.status,
          actual_result: values.actual_result || null,
          execution_time: values.execution_time || null,
          notes: values.notes || null,
          environment: values.environment || null,
          browser: values.browser || null,
          build_version: values.build_version || null,
          execution_date: new Date().toISOString(),
          attachments: [],
        });

      if (error) {
        throw error;
      }

      // If the test failed, create a defect automatically
      if (values.status === 'failed') {
        await supabase
          .from('test_defects')
          .insert({
            execution_id: '', // Will be set by the actual execution ID
            user_id: user.id,
            title: `Test Failed: ${testCase.title}`,
            description: values.actual_result || 'Test case failed during execution',
            severity: testCase.priority === 'critical' ? 'critical' : 'medium',
            priority: testCase.priority,
            status: 'open',
            environment: values.environment || null,
          });
      }

      toast({
        title: 'Success',
        description: `Test execution recorded as ${values.status}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error recording test execution:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record test execution',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-blue-600" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'blocked':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'skipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Execute Test Case
          </DialogTitle>
          <DialogDescription>
            Record the execution results for: {testCase.title}
          </DialogDescription>
        </DialogHeader>

        {/* Test Case Details */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <h4 className="font-medium mb-2">Test Steps:</h4>
            <ol className="list-decimal list-inside space-y-2">
              {testCase.test_steps.map((step, index) => (
                <li key={index} className="text-sm">
                  <span className="ml-2">{step.action}</span>
                  {step.expected_result && (
                    <div className="ml-6 text-xs text-muted-foreground">
                      Expected: {step.expected_result}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
          
          {testCase.expected_result && (
            <div>
              <h4 className="font-medium mb-1">Expected Result:</h4>
              <p className="text-sm text-muted-foreground">{testCase.expected_result}</p>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Execution Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select execution result" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="passed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Passed
                        </div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Failed
                        </div>
                      </SelectItem>
                      <SelectItem value="blocked">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          Blocked
                        </div>
                      </SelectItem>
                      <SelectItem value="skipped">
                        <div className="flex items-center gap-2">
                          <SkipForward className="h-4 w-4 text-blue-600" />
                          Skipped
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actual_result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Result</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what actually happened during test execution..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="execution_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Execution Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 5"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., staging, production"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="browser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Browser</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Chrome 96.0"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="build_version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Build Version</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., v1.2.3"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations or notes about the execution..."
                      className="min-h-[80px]"
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
                disabled={isExecuting}
                className="flex items-center gap-2"
              >
                {isExecuting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Record Execution
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}