import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Note, CreateNoteData, UpdateNoteData, Subtask, CreateFolderData } from '@/types/notes';
import { Json } from '@/integrations/supabase/types';

// Helper to safely parse subtasks from JSON
const parseSubtasks = (subtasks: Json | null): Subtask[] => {
  if (!subtasks || !Array.isArray(subtasks)) return [];
  return subtasks.map((s: unknown) => {
    const item = s as Record<string, unknown>;
    return {
      id: String(item.id || ''),
      title: String(item.title || ''),
      completed: Boolean(item.completed),
    };
  });
};

// Advance a due date by one recurrence interval
const nextDueDate = (dueDate: string, pattern: string): string => {
  const d = new Date(dueDate);
  switch (pattern) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    default: return dueDate;
  }
  return d.toISOString().split('T')[0];
};

// Helper to convert subtasks to JSON-safe format
const subtasksToJson = (subtasks: Subtask[]): Json => {
  return subtasks.map(s => ({
    id: s.id,
    title: s.title,
    completed: s.completed,
  })) as unknown as Json;
};

export const useNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Parse subtasks from JSONB and map to our Note type
      return (data || []).map(note => ({
        ...note,
        subtasks: parseSubtasks(note.subtasks),
        priority: note.priority as Note['priority'],
        status: note.status as Note['status'],
        type: note.type as Note['type'],
      })) as Note[];
    },
    enabled: !!user,
    staleTime: 5000,
    refetchInterval: 10000,
  });

  // Separate folders and notes
  const folders = notes.filter(n => n.is_folder);
  const actualNotes = notes.filter(n => !n.is_folder);

  useEffect(() => {
    const handleRefresh = () => refetch();
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, [refetch]);

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: CreateNoteData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: noteData.title,
          content: noteData.content,
          type: noteData.type,
          course: noteData.course,
          student_name: noteData.student_name,
          user_id: user.id,
          tags: noteData.tags || [],
          priority: noteData.priority || 'medium',
          starred: noteData.starred || false,
          due_date: noteData.due_date,
          funding_source_id: noteData.funding_source_id || null,
          subtasks: noteData.subtasks ? subtasksToJson(noteData.subtasks) : [],
          recurrence_pattern: noteData.recurrence_pattern || null,
          recurrence_end_date: noteData.recurrence_end_date || null,
          parent_folder_id: noteData.parent_folder_id || null,
          is_folder: false,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        subtasks: parseSubtasks(data.subtasks),
      } as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Success',
        description: `${data.type === 'note' ? 'Note' : data.type === 'commitment' ? 'Task' : 'Reminder'} created successfully`,
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

  const createFolderMutation = useMutation({
    mutationFn: async (folderData: CreateFolderData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: folderData.title,
          content: '',
          type: 'note',
          course: 'Folder',
          user_id: user.id,
          tags: [],
          priority: 'medium',
          starred: false,
          is_folder: true,
          folder_color: folderData.folder_color || 'blue',
          parent_folder_id: folderData.parent_folder_id || null,
          subtasks: [],
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Folder Created',
        description: 'New folder created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateNoteData }) => {
      // Convert subtasks to JSON-safe format if present
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.subtasks) {
        dbUpdates.subtasks = subtasksToJson(updates.subtasks);
      }
      
      const { data, error } = await supabase
        .from('notes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        subtasks: parseSubtasks(data.subtasks),
      } as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
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

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ noteId, subtasks }: { noteId: string; subtasks: Subtask[] }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ subtasks: subtasksToJson(subtasks) })
        .eq('id', noteId)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        subtasks: parseSubtasks(data.subtasks),
      } as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Success',
        description: 'Deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete',
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
      return {
        ...data,
        subtasks: parseSubtasks(data.subtasks),
      } as Note;
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

      // Completing a recurring task spawns the next occurrence. The completed
      // instance keeps its data but loses its recurrence so re-completing it
      // later can't spawn duplicates.
      const isRecurringCompletion =
        newStatus === 'completed' && !!note.recurrence_pattern && !!note.due_date;

      const { data, error } = await supabase
        .from('notes')
        .update({
          status: newStatus,
          ...(isRecurringCompletion ? { recurrence_pattern: null } : {}),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      let spawnedNext = false;
      if (isRecurringCompletion) {
        const next = nextDueDate(note.due_date!, note.recurrence_pattern!);
        const withinEnd =
          !note.recurrence_end_date || next <= note.recurrence_end_date;
        if (withinEnd && user) {
          const { error: spawnError } = await supabase.from('notes').insert([{
            title: note.title,
            content: note.content,
            type: note.type,
            course: note.course,
            student_name: note.student_name,
            user_id: user.id,
            tags: note.tags || [],
            priority: note.priority,
            starred: note.starred,
            due_date: next,
            funding_source_id: note.funding_source_id || null,
            subtasks: subtasksToJson(
              (note.subtasks || []).map(s => ({ ...s, completed: false }))
            ),
            recurrence_pattern: note.recurrence_pattern,
            recurrence_end_date: note.recurrence_end_date || null,
            parent_folder_id: note.parent_folder_id || null,
            is_folder: false,
          }]);
          if (spawnError) console.error('Failed to create next occurrence:', spawnError);
          else spawnedNext = true;
        }
      }

      return {
        note: { ...data, subtasks: parseSubtasks(data.subtasks) } as Note,
        spawnedNext,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (result.spawnedNext) {
        toast({
          title: 'Recurring task',
          description: 'Next occurrence has been scheduled.',
        });
      }
    },
  });

  const moveToFolder = useMutation({
    mutationFn: async ({ noteId, folderId }: { noteId: string; folderId: string | null }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ parent_folder_id: folderId })
        .eq('id', noteId)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        subtasks: parseSubtasks(data.subtasks),
      } as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    notes: actualNotes,
    folders,
    allNotes: notes,
    isLoading,
    error,
    createNote: createNoteMutation.mutateAsync,
    createFolder: createFolderMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    updateSubtasks: updateSubtaskMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    toggleStar: toggleStarMutation.mutateAsync,
    toggleStatus: toggleStatusMutation.mutateAsync,
    moveToFolder: moveToFolder.mutateAsync,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
};
