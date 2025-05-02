
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type TableName = 'notes' | 'meetings' | 'supplies' | 'expenses';

interface FetchOptions {
  table: TableName;
  transform?: (data: any) => any;
  enabled?: boolean;
}

export function useDataFetching<T>({ table, transform, enabled = true }: FetchOptions) {
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

      const { data: fetchedData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id);

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
          table 
        }, 
        () => {
          console.log(`Received real-time update for ${table}`);
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
    
    return () => {
      window.removeEventListener('seedDataCompleted', handleSeedData);
    };
  }, [user, enabled]);

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
