
import { supabase } from "@/integrations/supabase/client";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { useRefreshContext } from "@/App";

export interface PlanningEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'deadline' | 'event' | 'task' | 'meeting';
  course?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  user_id: string;
  created_at?: string;
}

export interface FutureTask {
  id: string;
  title: string;
  semester: string;
  priority: 'low' | 'medium' | 'high';
  estimated_hours?: number;
  description?: string;
  user_id: string;
  created_at?: string;
}

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

// Hook for fetching planning events
export const usePlanningEvents = () => {
  return useDataFetching<PlanningEvent>({
    table: 'planning_events',
    enabled: true
  });
};

// Hook for fetching future planning tasks
export const useFuturePlanning = () => {
  return useDataFetching<FutureTask>({
    table: 'future_planning',
    enabled: true
  });
};

// Hook for managing planning events
export const usePlanningEventActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerRefresh } = useRefreshContext();

  // Create a new planning event
  const createPlanningEvent = useCallback(async (eventData: EventFormData) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .insert([{
          ...eventData,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Event created",
        description: "Your event has been created successfully."
      });
      
      triggerRefresh('planning_events');
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "There was a problem creating your event.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, triggerRefresh]);

  // Update an existing planning event
  const updatePlanningEvent = useCallback(async (id: string, eventData: Partial<EventFormData>) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .update(eventData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully."
      });
      
      triggerRefresh('planning_events');
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "There was a problem updating your event.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, triggerRefresh]);

  // Toggle completion status of a task
  const toggleEventCompletion = useCallback(async (id: string, completed: boolean) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('planning_events')
        .update({ completed })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('type', 'task')
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: completed ? "Task completed" : "Task reopened",
        description: completed ? "The task has been marked as completed." : "The task has been reopened."
      });
      
      triggerRefresh('planning_events');
      return data;
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast({
        title: "Error",
        description: "There was a problem updating the task.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, triggerRefresh]);

  // Delete a planning event
  const deletePlanningEvent = useCallback(async (id: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('planning_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully."
      });
      
      triggerRefresh('planning_events');
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "There was a problem deleting your event.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast, triggerRefresh]);

  return { createPlanningEvent, updatePlanningEvent, toggleEventCompletion, deletePlanningEvent };
};

// Hook for managing future planning tasks
export const useFutureTaskActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerRefresh } = useRefreshContext();

  // Create a new future planning task
  const createFutureTask = useCallback(async (taskData: FutureTaskFormData) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('future_planning')
        .insert([{
          ...taskData,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Task created",
        description: "Your future planning task has been created successfully."
      });
      
      triggerRefresh('future_planning');
      return data;
    } catch (error) {
      console.error('Error creating future task:', error);
      toast({
        title: "Error",
        description: "There was a problem creating your task.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, triggerRefresh]);

  // Update an existing future planning task
  const updateFutureTask = useCallback(async (id: string, taskData: Partial<FutureTaskFormData>) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('future_planning')
        .update(taskData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Task updated",
        description: "Your future planning task has been updated successfully."
      });
      
      triggerRefresh('future_planning');
      return data;
    } catch (error) {
      console.error('Error updating future task:', error);
      toast({
        title: "Error",
        description: "There was a problem updating your task.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, triggerRefresh]);

  // Delete a future planning task
  const deleteFutureTask = useCallback(async (id: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('future_planning')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Task deleted",
        description: "Your future planning task has been deleted successfully."
      });
      
      triggerRefresh('future_planning');
      return true;
    } catch (error) {
      console.error('Error deleting future task:', error);
      toast({
        title: "Error",
        description: "There was a problem deleting your task.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast, triggerRefresh]);

  return { createFutureTask, updateFutureTask, deleteFutureTask };
};
