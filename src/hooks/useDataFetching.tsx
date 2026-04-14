
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type TableName = 'notes' | 'meetings' | 'supplies' | 'expenses' | 'shopping_list' | 'planning_events' | 'future_planning' | 'funding_sources' | 'funding_expenditures' | 'notification_preferences' | 'feedback' | 'admin_communications' | 'scholastic_achievements' | 'test_projects' | 'test_suites' | 'test_cases' | 'test_executions' | 'test_defects' | 'test_requirements' | 'test_team_members' | 'test_automation_configs' | 'test_case_requirements' | 'user_subscriptions';

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
  
  // Stable keys — only recompute when values actually change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtersKey = useMemo(() => JSON.stringify(filters), [JSON.stringify(filters)]);
  // transformKey: use a ref so changing the function reference doesn't recreate fetchData
  const transformRef = useRef(transform);
  transformRef.current = transform;

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
        .select('*');

      // Add user_id filter for tables that have direct user ownership
      // Test tables use project-membership RLS, so we don't filter by user_id
      const tablesWithoutUserIdFilter = [
        'admin_communications', 
        'test_cases', 'test_suites', 'test_executions', 'test_defects', 
        'test_requirements', 'test_team_members', 'test_automation_configs', 'test_case_requirements'
      ];
      if (!tablesWithoutUserIdFilter.includes(table)) {
        query = query.eq('user_id', user.id);
      }
      
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

      const transformedData = transformRef.current
        ? transformRef.current(fetchedData)
        : fetchedData;
      setData(transformedData || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      // Only show toast for genuine errors, not auth/RLS issues
      const errMsg = err instanceof Error ? err.message : '';
      if (!errMsg.includes('JWT') && !errMsg.includes('permission') && !errMsg.includes('row-level security')) {
        toast({
          title: "Error",
          description: `Failed to fetch ${table} data`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, table, enabled, toast, filtersKey]);

  // Initial data fetch
  useEffect(() => {
    if (user && enabled) {
      fetchData();
    }
  }, [fetchData]);

  // Keep a stable ref to fetchData so the realtime subscription never needs to re-subscribe
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  // Subscribe to real-time changes — deps intentionally omit fetchData to avoid channel churn
  useEffect(() => {
    if (!user || !enabled) return;

    const noUserFilter = ['admin_communications', 'test_cases', 'test_suites', 'test_executions',
      'test_defects', 'test_requirements', 'test_team_members', 'test_automation_configs', 'test_case_requirements'];

    const channel = supabase
      .channel(`${table}_changes_${user.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: !noUserFilter.includes(table) ? `user_id=eq.${user.id}` : undefined,
        },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const newItem = transformRef.current
                ? transformRef.current([payload.new])[0]
                : payload.new as T;
              setData(current => {
                // @ts-ignore
                const exists = current.some(item => item.id === newItem.id);
                return exists ? current : [...current, newItem];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = transformRef.current
                ? transformRef.current([payload.new])[0]
                : payload.new as T;
              setData(current =>
                // @ts-ignore
                current.map(item => item.id === updatedItem.id ? updatedItem : item)
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedItem = payload.old as T;
              // @ts-ignore
              setData(current => current.filter(item => item.id !== deletedItem.id));
            }
          } catch {
            fetchDataRef.current();
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, table, enabled]);

  // Listen for external refresh events — use ref so handlers are always stable
  useEffect(() => {
    const handleSeedData = () => {
      if (enabled) fetchDataRef.current();
    };
    const handleRefreshData = (event: Event) => {
      const customEvent = event as CustomEvent<{ table?: string }>;
      if (enabled && (!customEvent.detail?.table || customEvent.detail.table === table)) {
        fetchDataRef.current();
      }
    };
    window.addEventListener('seedDataCompleted', handleSeedData);
    window.addEventListener('refreshData', handleRefreshData as EventListener);
    return () => {
      window.removeEventListener('seedDataCompleted', handleSeedData);
      window.removeEventListener('refreshData', handleRefreshData as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, table]);

  // Simple refetch function
  const refetch = useCallback(() => {
    console.log(`Manually refetching ${table} data`);
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
