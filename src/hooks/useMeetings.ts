import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Meeting, CreateMeetingData, UpdateMeetingData } from '@/types/meetings';

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
      return data as Meeting[];
    },
    enabled: !!user,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: CreateMeetingData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('meetings')
        .insert([{
          ...meetingData,
          user_id: user.id,
          attendees: meetingData.attendees || [],
          action_items: [],
          attachments: [],
          is_recurring: meetingData.is_recurring || false,
          reminder_minutes: meetingData.reminder_minutes || 15,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Meeting;
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
      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Meeting;
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
      const { data, error } = await supabase
        .from('meetings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
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