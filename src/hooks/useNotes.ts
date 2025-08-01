import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Note, CreateNoteData, UpdateNoteData } from '@/types/notes';

export const useNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching notes for user:', user.id);
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Notes query result:', { data, error });
      
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!user,
    staleTime: 5000, // Reduced to 5 seconds for immediate updates
    refetchInterval: 10000, // Reduced to 10 seconds for faster polling
  });

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefresh = () => refetch();
    
    window.addEventListener('refreshData', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshData', handleRefresh);
    };
  }, [refetch]);

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: CreateNoteData) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Creating note with data:', noteData);
      console.log('User ID:', user.id);
      
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          user_id: user.id,
          tags: noteData.tags || [],
          priority: noteData.priority || 'medium',
          starred: noteData.starred || false,
        }])
        .select()
        .single();
      
      console.log('Create result:', { data, error });
      
      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Success',
        description: `${data.type === 'note' ? 'Note' : data.type === 'commitment' ? 'Commitment' : 'Reminder'} created successfully`,
      });
    },
    onError: (error) => {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create note',
        variant: 'destructive',
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateNoteData }) => {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting note:', id);
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      console.log('Delete result:', { error });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Success',
        description: 'Note deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: async (id: string) => {
      const note = notes.find(n => n.id === id);
      if (!note) throw new Error('Note not found');
      
      const { data, error } = await supabase
        .from('notes')
        .update({ starred: !note.starred })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const note = notes.find(n => n.id === id);
      if (!note) throw new Error('Note not found');
      
      const newStatus = note.status === 'completed' ? 'active' : 'completed';
      
      const { data, error } = await supabase
        .from('notes')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    notes,
    isLoading,
    error,
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    toggleStar: toggleStarMutation.mutateAsync,
    toggleStatus: toggleStatusMutation.mutateAsync,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
};