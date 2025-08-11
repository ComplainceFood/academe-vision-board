
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export interface PlanningEvent {
  id?: string;
  title: string;
  date: string;
  time?: string;
  end_time?: string;
  type: string;
  course?: string;
  description?: string;
  priority?: string;
  completed?: boolean;
  user_id?: string;
  created_at?: string;
  location?: string;
  external_id?: string;
  external_source?: string;
  is_synced?: boolean;
}

export interface FutureTask {
  id?: string;
  title: string;
  semester: string;
  priority: string;
  estimated_hours?: number;
  user_id?: string;
  created_at?: string;
}

export interface EventFormData {
  title: string;
  date: string;
  time?: string;
  type: string;
  course?: string;
  description?: string;
  priority?: string;
}

export interface FutureTaskFormData {
  title: string;
  semester: string;
  priority: string;
  estimated_hours?: number;
}

export const planningService = {
  // Planning Events
  async getEvents(userId: string): Promise<PlanningEvent[]> {
    const { data, error } = await supabase
      .from('planning_events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createEvent(event: Omit<PlanningEvent, 'id' | 'created_at'>, userId: string): Promise<PlanningEvent> {
    const eventWithUserId = {
      ...event,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('planning_events')
      .insert(eventWithUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvent(id: string, updates: Partial<PlanningEvent>): Promise<PlanningEvent> {
    const { data, error } = await supabase
      .from('planning_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('planning_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Future Planning Tasks
  async getFutureTasks(userId: string): Promise<FutureTask[]> {
    const { data, error } = await supabase
      .from('future_planning')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createFutureTask(task: Omit<FutureTask, 'id' | 'created_at'>, userId: string): Promise<FutureTask> {
    const taskWithUserId = {
      ...task,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('future_planning')
      .insert(taskWithUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFutureTask(id: string, updates: Partial<FutureTask>): Promise<FutureTask> {
    const { data, error } = await supabase
      .from('future_planning')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFutureTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('future_planning')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Utility functions
  async getEventsByDateRange(userId: string, startDate: string, endDate: string): Promise<PlanningEvent[]> {
    const { data, error } = await supabase
      .from('planning_events')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTasksByPriority(userId: string, priority: string): Promise<FutureTask[]> {
    const { data, error } = await supabase
      .from('future_planning')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', priority)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Custom hooks
export const usePlanningEvents = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['planning-events', user?.id],
    queryFn: () => planningService.getEvents(user?.id || ''),
    enabled: !!user?.id,
  });
};

export const useFuturePlanning = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['future-planning', user?.id],
    queryFn: () => planningService.getFutureTasks(user?.id || ''),
    enabled: !!user?.id,
  });
};

export const usePlanningEventActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createPlanningEvent = useMutation({
    mutationFn: (eventData: EventFormData) => 
      planningService.createEvent(eventData, user?.id || ''),
    onSuccess: () => {
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['planning-events'] });
      queryClient.refetchQueries({ queryKey: ['planning-events'] });
    },
  });

  const updatePlanningEvent = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PlanningEvent> }) =>
      planningService.updateEvent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-events'] });
      queryClient.refetchQueries({ queryKey: ['planning-events'] });
    },
  });

  const deletePlanningEvent = useMutation({
    mutationFn: (id: string) => planningService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-events'] });
      queryClient.refetchQueries({ queryKey: ['planning-events'] });
    },
  });

  const toggleEventCompletion = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      planningService.updateEvent(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-events'] });
      queryClient.refetchQueries({ queryKey: ['planning-events'] });
    },
  });

  return {
    createPlanningEvent: createPlanningEvent.mutateAsync,
    updatePlanningEvent: updatePlanningEvent.mutateAsync,
    deletePlanningEvent: deletePlanningEvent.mutateAsync,
    toggleEventCompletion: toggleEventCompletion.mutateAsync,
  };
};

export const useFutureTaskActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createFutureTask = useMutation({
    mutationFn: (taskData: FutureTaskFormData) => 
      planningService.createFutureTask(taskData, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['future-planning'] });
    },
  });

  const updateFutureTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FutureTask> }) =>
      planningService.updateFutureTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['future-planning'] });
    },
  });

  const deleteFutureTask = useMutation({
    mutationFn: (id: string) => planningService.deleteFutureTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['future-planning'] });
    },
  });

  return {
    createFutureTask: createFutureTask.mutateAsync,
    updateFutureTask: updateFutureTask.mutateAsync,
    deleteFutureTask: deleteFutureTask.mutateAsync,
  };
};
