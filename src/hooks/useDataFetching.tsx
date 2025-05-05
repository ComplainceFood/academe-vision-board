
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type TableName = 'notes' | 'meetings' | 'supplies' | 'expenses';

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

  // Function to fetch data
  const fetchData = async () => {
    if (!user || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

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
    }
  };

  // Subscribe to real-time changes
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
          fetchData();
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, table, enabled]);

  // Listen for seed data event
  useEffect(() => {
    const handleSeedData = () => {
      if (enabled) {
        console.log(`Handling seed data event for ${table}`);
        fetchData();
      }
    };

    window.addEventListener('seedDataCompleted', handleSeedData);
    
    // Listen for refresh events - for auto-refresh after actions
    const handleRefreshData = (event: Event) => {
      const customEvent = event as CustomEvent<{table?: string}>;
      if (enabled && (!customEvent.detail?.table || customEvent.detail.table === table)) {
        console.log(`Handling refresh event for ${table}`);
        fetchData();
      }
    };

    window.addEventListener('refreshData', handleRefreshData as EventListener);
    
    return () => {
      window.removeEventListener('seedDataCompleted', handleSeedData);
      window.removeEventListener('refreshData', handleRefreshData as EventListener);
    };
  }, [user, enabled, table]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [user, enabled]);

  const refetch = () => {
    console.log(`Manually refetching ${table} data`);
    fetchData();
  };

  return { data, isLoading, error, refetch };
}
