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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'manager', 'lead_tester', 'tester', 'developer', 'viewer']).default('tester'),
  can_create_tests: z.boolean().default(true),
  can_execute_tests: z.boolean().default(true),
  can_manage_defects: z.boolean().default(false),
  can_view_reports: z.boolean().default(true),
  can_manage_team: z.boolean().default(false),
});

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function AddTeamMemberDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onSuccess 
}: AddTeamMemberDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: '',
      role: 'tester',
      can_create_tests: true,
      can_execute_tests: true,
      can_manage_defects: false,
      can_view_reports: true,
      can_manage_team: false,
    },
  });

  const watchedRole = form.watch('role');

  // Auto-set permissions based on role
  React.useEffect(() => {
    const rolePermissions = {
      admin: {
        can_create_tests: true,
        can_execute_tests: true,
        can_manage_defects: true,
        can_view_reports: true,
        can_manage_team: true,
      },
      manager: {
        can_create_tests: true,
        can_execute_tests: true,
        can_manage_defects: true,
        can_view_reports: true,
        can_manage_team: true,
      },
      lead_tester: {
        can_create_tests: true,
        can_execute_tests: true,
        can_manage_defects: true,
        can_view_reports: true,
        can_manage_team: false,
      },
      tester: {
        can_create_tests: true,
        can_execute_tests: true,
        can_manage_defects: false,
        can_view_reports: true,
        can_manage_team: false,
      },
      developer: {
        can_create_tests: true,
        can_execute_tests: true,
        can_manage_defects: true,
        can_view_reports: true,
        can_manage_team: false,
      },
      viewer: {
        can_create_tests: false,
        can_execute_tests: false,
        can_manage_defects: false,
        can_view_reports: true,
        can_manage_team: false,
      },
    };

    const permissions = rolePermissions[watchedRole];
    if (permissions) {
      Object.entries(permissions).forEach(([key, value]) => {
        form.setValue(key as any, value);
      });
    }
  }, [watchedRole, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add team members',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permissions = {
        can_create_tests: values.can_create_tests,
        can_execute_tests: values.can_execute_tests,
        can_manage_defects: values.can_manage_defects,
        can_view_reports: values.can_view_reports,
        can_manage_team: values.can_manage_team,
      };

      const { error } = await supabase
        .from('test_team_members')
        .insert({
          project_id: projectId,
          user_id: values.user_id,
          role: values.role,
          permissions: permissions,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Team member added successfully',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add team member',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to this testing project with specific role and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter user ID or email" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="lead_tester">Lead Tester</SelectItem>
                      <SelectItem value="tester">Tester</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Permissions</FormLabel>
              
              <FormField
                control={form.control}
                name="can_create_tests"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Can create test cases</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_execute_tests"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Can execute tests</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_manage_defects"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Can manage defects</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_view_reports"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Can view reports</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_manage_team"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Can manage team</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

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
                Add Member
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}