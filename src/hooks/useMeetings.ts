import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Meeting, CreateMeetingData, UpdateMeetingData } from '@/types/meetings';

// Advance a date by one recurrence interval (date-only string in/out)
const nextMeetingDate = (date: string, pattern: string): string => {
  const d = new Date(date);
  switch (pattern) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    default: return date;
  }
  return d.toISOString().split('T')[0];
};

export const useMeetings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading, error } = useQuery({
    queryKey: ['meetings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to match our TypeScript types
      return (data || []).map(meeting => ({
        ...meeting,
        attendees: Array.isArray(meeting.attendees) ? meeting.attendees as any : [],
        action_items: Array.isArray(meeting.action_items) ? meeting.action_items as any : [],
        attachments: Array.isArray(meeting.attachments) ? meeting.attachments as any : [],
      })) as unknown as Meeting[];
    },
    enabled: !!user,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: CreateMeetingData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('meetings')
        .insert([{
          title: meetingData.title,
          description: meetingData.description,
          type: meetingData.type,
          start_date: meetingData.start_date,
          start_time: meetingData.start_time,
          end_time: meetingData.end_time,
          location: meetingData.location,
          agenda: meetingData.agenda,
          user_id: user.id,
          attendees: (meetingData.attendees || []) as any,
          action_items: [] as any,
          attachments: [] as any,
          is_recurring: meetingData.is_recurring || false,
          recurring_pattern: meetingData.recurring_pattern,
          recurring_end_date: meetingData.recurring_end_date,
          reminder_minutes: meetingData.reminder_minutes || 15,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform the returned data
      const meeting = {
        ...data,
        attendees: Array.isArray(data.attendees) ? data.attendees as any : [],
        action_items: Array.isArray(data.action_items) ? data.action_items as any : [],
        attachments: Array.isArray(data.attachments) ? data.attachments as any : [],
      };
      
      return meeting as unknown as Meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: 'Success',
        description: 'Meeting created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to create meeting',
        variant: 'destructive',
      });
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateMeetingData }) => {
      // Convert TypeScript types to database-compatible JSON
      const dbUpdates = {
        ...updates,
        attendees: updates.attendees as any,
        action_items: updates.action_items as any,
      };
      
      const { data, error } = await supabase
        .from('meetings')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform the returned data
      const meeting = {
        ...data,
        attendees: Array.isArray(data.attendees) ? data.attendees as any : [],
        action_items: Array.isArray(data.action_items) ? data.action_items as any : [],
        attachments: Array.isArray(data.attachments) ? data.attachments as any : [],
      };
      
      return meeting as unknown as Meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: 'Success',
        description: 'Meeting updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update meeting',
        variant: 'destructive',
      });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: 'Success',
        description: 'Meeting deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete meeting',
        variant: 'destructive',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Meeting['status'] }) => {
      const existing = meetings.find(m => m.id === id);

      // Completing a recurring meeting schedules the next occurrence. The
      // completed instance loses its recurrence so re-completing it later
      // can't create duplicates.
      const isRecurringCompletion =
        status === 'completed' && !!existing?.is_recurring &&
        !!existing.recurring_pattern && !!existing.start_date;

      const { data, error } = await supabase
        .from('meetings')
        .update({
          status,
          ...(isRecurringCompletion ? { is_recurring: false, recurring_pattern: null } : {}),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      let spawnedNext = false;
      if (isRecurringCompletion && user && existing) {
        const next = nextMeetingDate(existing.start_date, existing.recurring_pattern!);
        const withinEnd = !existing.recurring_end_date || next <= existing.recurring_end_date;
        if (withinEnd) {
          const { error: spawnError } = await supabase.from('meetings').insert([{
            title: existing.title,
            description: existing.description || '',
            type: existing.type,
            status: 'scheduled',
            start_date: next,
            start_time: existing.start_time,
            end_time: existing.end_time,
            location: existing.location,
            agenda: existing.agenda,
            attendees: (existing.attendees || []).map(a => ({ ...a, status: 'pending' })) as any,
            user_id: user.id,
            notes: '',
            action_items: [] as any,
            attachments: [] as any,
            is_recurring: true,
            recurring_pattern: existing.recurring_pattern,
            recurring_end_date: existing.recurring_end_date || null,
            reminder_minutes: existing.reminder_minutes || 15,
            funding_source_id: (existing as any).funding_source_id || null,
          }]);
          if (spawnError) console.error('Failed to schedule next occurrence:', spawnError);
          else spawnedNext = true;
        }
      }

      // Transform the returned data
      const meeting = {
        ...data,
        attendees: Array.isArray(data.attendees) ? data.attendees as any : [],
        action_items: Array.isArray(data.action_items) ? data.action_items as any : [],
        attachments: Array.isArray(data.attachments) ? data.attachments as any : [],
      };

      return { meeting: meeting as unknown as Meeting, spawnedNext };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      if (result.spawnedNext) {
        toast({
          title: 'Recurring meeting',
          description: 'The next occurrence has been scheduled.',
        });
      }
    },
  });

  return {
    meetings,
    isLoading,
    error,
    createMeeting: createMeetingMutation.mutateAsync,
    updateMeeting: updateMeetingMutation.mutateAsync,
    deleteMeeting: deleteMeetingMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isCreating: createMeetingMutation.isPending,
    isUpdating: updateMeetingMutation.isPending,
    isDeleting: deleteMeetingMutation.isPending,
  };
};