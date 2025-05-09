
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface PlanningEvent {
  id?: string;
  title: string;
  date: string;
  time?: string;
  type: 'deadline' | 'event' | 'task' | 'meeting';
  course?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  user_id?: string;
}

export interface FutureTask {
  id?: string;
  title: string;
  semester: string;
  priority: 'low' | 'medium' | 'high';
  estimated_hours?: number;
  description?: string;
  user_id?: string;
}

// Form data types for the dialogs
export interface EventFormData {
  title: string;
  date: string;
  time?: string;
  type: 'deadline' | 'event' | 'task' | 'meeting';
  course?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface FutureTaskFormData {
  title: string;
  semester: string;
  priority: 'low' | 'medium' | 'high';
  estimated_hours?: number;
  description?: string;
}

// Base database operations
export const getEvents = async () => {
  const { data, error } = await supabase
    .from('planning_events' as any)
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
};

export const createEvent = async (event: PlanningEvent) => {
  const { data, error } = await supabase
    .from('planning_events' as any)
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEvent = async (id: string, updates: Partial<PlanningEvent>) => {
  const { data, error } = await supabase
    .from('planning_events' as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEvent = async (id: string) => {
  const { error } = await supabase
    .from('planning_events' as any)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getFutureTasks = async () => {
  const { data, error } = await supabase
    .from('future_planning' as any)
    .select('*')
    .order('priority', { ascending: false });

  if (error) throw error;
  return data;
};

export const createFutureTask = async (task: FutureTask) => {
  const { data, error } = await supabase
    .from('future_planning' as any)
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateFutureTask = async (id: string, updates: Partial<FutureTask>) => {
  const { data, error } = await supabase
    .from('future_planning' as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteFutureTask = async (id: string) => {
  const { error } = await supabase
    .from('future_planning' as any)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// React Query Hooks
export const usePlanningEvents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['planning_events'],
    queryFn: getEvents,
    enabled: !!user,
  });
};

export const useFuturePlanning = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['future_planning'],
    queryFn: getFutureTasks,
    enabled: !!user,
  });
};

// Planning Event Actions Hook
export const usePlanningEventActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Create a new planning event
  const createPlanningEvent = useMutation({
    mutationFn: (eventData: EventFormData) => {
      const newEvent: PlanningEvent = {
        ...eventData,
        user_id: user?.id,
      };
      return createEvent(newEvent);
    },
    onSuccess: () => {
      toast({
        description: "Event created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['planning_events'] });
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast({
        variant: "destructive",
        description: "Failed to create event",
      });
    },
  });

  // Update a planning event
  const updatePlanningEvent = useMutation({
    mutationFn: (params: { id: string; data: Partial<EventFormData> }) => {
      return updateEvent(params.id, params.data);
    },
    onSuccess: () => {
      toast({
        description: "Event updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['planning_events'] });
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast({
        variant: "destructive",
        description: "Failed to update event",
      });
    },
  });

  // Toggle event completion status
  const toggleEventCompletion = useMutation({
    mutationFn: (params: { id: string; completed: boolean }) => {
      return updateEvent(params.id, { completed: params.completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning_events'] });
    },
    onError: (error) => {
      console.error("Error toggling event completion:", error);
      toast({
        variant: "destructive",
        description: "Failed to update event status",
      });
    },
  });

  // Delete a planning event
  const deletePlanningEvent = useMutation({
    mutationFn: (id: string) => {
      return deleteEvent(id);
    },
    onSuccess: () => {
      toast({
        description: "Event deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['planning_events'] });
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete event",
      });
    },
  });

  return {
    createPlanningEvent: (data: EventFormData) => createPlanningEvent.mutate(data),
    updatePlanningEvent: (id: string, data: Partial<EventFormData>) => 
      updatePlanningEvent.mutate({ id, data }),
    toggleEventCompletion: (id: string, completed: boolean) => 
      toggleEventCompletion.mutate({ id, completed }),
    deletePlanningEvent: (id: string) => deletePlanningEvent.mutate(id),
  };
};

// Future Task Actions Hook
export const useFutureTaskActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Create a new future task
  const createTask = useMutation({
    mutationFn: (taskData: FutureTaskFormData) => {
      const newTask: FutureTask = {
        ...taskData,
        user_id: user?.id,
      };
      return createFutureTask(newTask);
    },
    onSuccess: () => {
      toast({
        description: "Task created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['future_planning'] });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast({
        variant: "destructive",
        description: "Failed to create task",
      });
    },
  });

  // Update a future task
  const updateTask = useMutation({
    mutationFn: (params: { id: string; data: Partial<FutureTaskFormData> }) => {
      return updateFutureTask(params.id, params.data);
    },
    onSuccess: () => {
      toast({
        description: "Task updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['future_planning'] });
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast({
        variant: "destructive",
        description: "Failed to update task",
      });
    },
  });

  // Delete a future task
  const deleteTask = useMutation({
    mutationFn: (id: string) => {
      return deleteFutureTask(id);
    },
    onSuccess: () => {
      toast({
        description: "Task deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['future_planning'] });
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast({
        variant: "destructive",
        description: "Failed to delete task",
      });
    },
  });

  return {
    createFutureTask: (data: FutureTaskFormData) => createTask.mutate(data),
    updateFutureTask: (id: string, data: Partial<FutureTaskFormData>) => 
      updateTask.mutate({ id, data }),
    deleteFutureTask: (id: string) => deleteTask.mutate(id),
  };
};
