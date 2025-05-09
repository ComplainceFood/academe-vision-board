
import { supabase } from "@/integrations/supabase/client";

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
