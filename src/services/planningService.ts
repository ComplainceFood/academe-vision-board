
import { supabase } from "@/integrations/supabase/client";

export interface PlanningEvent {
  id?: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  course?: string;
  description?: string;
  priority?: string;
  completed?: boolean;
  user_id?: string;
  created_at?: string;
}

export interface FutureTask {
  id?: string;
  title: string;
  description?: string;
  semester: string;
  priority: string;
  estimated_hours?: number;
  user_id?: string;
  created_at?: string;
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
