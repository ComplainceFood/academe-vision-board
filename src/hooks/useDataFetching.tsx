
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface FetchOptions {
  table: string;
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

      // Transform data if transform function is provided
      const transformedData = transform ? fetchedData.map(transform) : fetchedData;
      setData(transformedData);
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

  // Listen for seed data events
  useEffect(() => {
    const handleSeedData = () => {
      if (enabled) {
        fetchData();
      }
    };

    window.addEventListener('seedDataCompleted', handleSeedData);
    
    return () => {
      window.removeEventListener('seedDataCompleted', handleSeedData);
    };
  }, [user, enabled]);

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, [user, enabled]);

  // Function to refresh data
  const refetch = () => fetchData();

  return { data, isLoading, error, refetch };
}
