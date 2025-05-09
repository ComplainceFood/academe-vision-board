
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type TableName = 'notes' | 'meetings' | 'supplies' | 'expenses' | 'shopping_list' | 'planning_events' | 'future_planning';

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
  const isFetchingRef = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Debounce timers and fetch queue management
  const debounceTimerRef = useRef<number | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 300; // milliseconds
  const fetchQueueRef = useRef<boolean>(false);

  // Function to fetch data with debouncing and queuing
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!user || !enabled) {
      return;
    }

    const now = Date.now();
    
    // If already fetching, queue another fetch
    if (isFetchingRef.current) {
      fetchQueueRef.current = true;
      return;
    }
    
    // Implement rate limiting with forceRefresh override
    if (!forceRefresh && now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      
      // Set a new debounce timer
      debounceTimerRef.current = window.setTimeout(() => {
        fetchData(true);
        debounceTimerRef.current = null;
      }, MIN_FETCH_INTERVAL);
      
      return;
    }

    try {
      isFetchingRef.current = true;
      setError(null);
      
      if (isLoading) {
        // Only show loading state on initial load, not on subsequent fetches
        setIsLoading(true);
      }

      lastFetchTimeRef.current = now;

      // Type annotation to resolve infinite type instantiation
      let query: any = supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id);
      
      // Apply any additional filters
      for (const filter of filters) {
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

      const transformedData = transform ? fetchedData.map(transform) : fetchedData;
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
      
      // Short delay before allowing another fetch
      setTimeout(() => {
        isFetchingRef.current = false;
        
        // If a fetch was queued during this operation, execute it now
        if (fetchQueueRef.current) {
          fetchQueueRef.current = false;
          fetchData(true);
        }
      }, 100);
    }
  }, [user, table, enabled, filters, transform, isLoading, toast]);

  // Subscribe to real-time changes with improved state handling
  useEffect(() => {
    if (!user || !enabled) return;

    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log(`Received real-time update for ${table}:`, payload);
          
          // Update data without a full refetch when possible
          if (payload.eventType === 'INSERT') {
            const newItem = transform ? transform(payload.new) : payload.new as T;
            setData(current => [...current, newItem]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = transform ? transform(payload.new) : payload.new as T;
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
          } else {
            // If we can't handle the change optimistically, do a full refetch
            fetchData(true);
          }
        })
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${table}:`, status);
      });

    return () => {
      console.log(`Removing realtime channel for ${table}`);
      supabase.removeChannel(channel);
    };
  }, [user, table, enabled, transform, fetchData]);

  // Listen for seed data and refresh events
  useEffect(() => {
    const handleSeedData = () => {
      if (enabled) {
        console.log(`Handling seed data event for ${table}`);
        fetchData(true);
      }
    };

    window.addEventListener('seedDataCompleted', handleSeedData);
    
    // Listen for refresh events - for auto-refresh after actions
    const handleRefreshData = (event: Event) => {
      const customEvent = event as CustomEvent<{table?: string}>;
      if (enabled && (!customEvent.detail?.table || customEvent.detail.table === table)) {
        console.log(`Handling refresh event for ${table}`);
        fetchData(true);
      }
    };

    window.addEventListener('refreshData', handleRefreshData as EventListener);
    
    return () => {
      window.removeEventListener('seedDataCompleted', handleSeedData);
      window.removeEventListener('refreshData', handleRefreshData as EventListener);
    };
  }, [enabled, table, fetchData]);

  // Initial data fetch with retry mechanism
  useEffect(() => {
    const attemptFetch = async (retryCount = 0) => {
      try {
        await fetchData();
      } catch (err) {
        if (retryCount < 3) {
          console.log(`Retrying fetch for ${table}, attempt ${retryCount + 1}`);
          setTimeout(() => attemptFetch(retryCount + 1), 1000 * (retryCount + 1));
        }
      }
    };
    
    if (user && enabled) {
      attemptFetch();
    }
  }, [user, enabled, fetchData, table]);

  // Improved refetch function with queuing mechanism
  const refetch = useCallback(() => {
    console.log(`Manually refetching ${table} data`);
    fetchData(true);
  }, [fetchData, table]);

  return { data, isLoading, error, refetch };
}
