
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type TableName = 'notes' | 'meetings' | 'supplies' | 'expenses' | 'shopping_list' | 'planning_events' | 'future_planning' | 'funding_sources' | 'funding_expenditures' | 'notification_preferences' | 'feedback';

interface Filter {
  column: string;
  value: any;
  operator?: string;
}

interface FetchOptions {
  table: TableName;
  transform?: (data: any) => any;
  enabled?: boolean;
  filters?: Filter[];
}

export function useDataFetching<T>({ table, transform, enabled = true, filters = [] }: FetchOptions) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Stabilize the filters array to prevent unnecessary re-renders
  const stableFilters = useRef(filters);
  const stableTransform = useRef(transform);
  
  // Update refs when values change
  useEffect(() => {
    stableFilters.current = filters;
    stableTransform.current = transform;
  }, [filters, transform]);

  // Function to fetch data
  const fetchData = useCallback(async () => {
    if (!user || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      let query: any = supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id);
      
      // Apply any additional filters
      for (const filter of stableFilters.current) {
        const { column, value, operator = 'eq' } = filter;
        switch (operator) {
          case 'eq':
            query = query.eq(column, value);
            break;
          case 'neq':
            query = query.neq(column, value);
            break;
          case 'gt':
            query = query.gt(column, value);
            break;
          case 'lt':
            query = query.lt(column, value);
            break;
          case 'gte':
            query = query.gte(column, value);
            break;
          case 'lte':
            query = query.lte(column, value);
            break;
          case 'in':
            query = query.in(column, Array.isArray(value) ? value : [value]);
            break;
          default:
            query = query.eq(column, value);
        }
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch ${table}: ${fetchError.message}`);
      }

      const transformedData = stableTransform.current 
        ? fetchedData.map(stableTransform.current) 
        : fetchedData;
      setData(transformedData || []);
      console.log(`Fetched ${table} data:`, transformedData);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      toast({
        title: "Error",
        description: `Failed to fetch ${table} data`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, table, enabled, toast]);

  // Initial data fetch
  useEffect(() => {
    if (user && enabled) {
      fetchData();
    }
  }, [fetchData]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user || !enabled) return;

    console.log(`Setting up realtime subscription for ${table}`);
    
    const channel = supabase
      .channel(`${table}_changes_${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log(`Received real-time update for ${table}:`, payload);
          
          // Update data optimistically
          if (payload.eventType === 'INSERT') {
            const newItem = stableTransform.current 
              ? stableTransform.current(payload.new) 
              : payload.new as T;
            setData(current => [...current, newItem]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = stableTransform.current 
              ? stableTransform.current(payload.new) 
              : payload.new as T;
            setData(current => 
              current.map(item => 
                // @ts-ignore - we know id exists on the item
                item.id === updatedItem.id ? updatedItem : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedItem = payload.old as T;
            setData(current => 
              current.filter(item => 
                // @ts-ignore - we know id exists on the item
                item.id !== deletedItem.id
              )
            );
          }
        })
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${table}:`, status);
      });

    return () => {
      console.log(`Cleaning up realtime channel for ${table}`);
      supabase.removeChannel(channel);
    };
  }, [user?.id, table, enabled]);

  // Listen for external refresh events
  useEffect(() => {
    const handleSeedData = () => {
      if (enabled) {
        console.log(`Handling seed data event for ${table}`);
        fetchData();
      }
    };

    const handleRefreshData = (event: Event) => {
      const customEvent = event as CustomEvent<{table?: string}>;
      if (enabled && (!customEvent.detail?.table || customEvent.detail.table === table)) {
        console.log(`Handling refresh event for ${table}`);
        fetchData();
      }
    };

    window.addEventListener('seedDataCompleted', handleSeedData);
    window.addEventListener('refreshData', handleRefreshData as EventListener);
    
    return () => {
      window.removeEventListener('seedDataCompleted', handleSeedData);
      window.removeEventListener('refreshData', handleRefreshData as EventListener);
    };
  }, [enabled, table, fetchData]);

  // Simple refetch function
  const refetch = useCallback(() => {
    console.log(`Manually refetching ${table} data`);
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
