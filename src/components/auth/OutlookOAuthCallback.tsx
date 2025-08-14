import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const OutlookOAuthCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Check for errors
      if (error) {
        toast.error('OAuth authorization failed: ' + error);
        window.close();
        return;
      }

      if (!code || !state) {
        toast.error('Missing authorization code or state parameter');
        window.close();
        return;
      }

      try {
        // Exchange code for tokens using our edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('outlook-oauth-exchange', {
          body: { code, state }
        });

        if (exchangeError) {
          throw new Error(exchangeError.message);
        }

        toast.success('Outlook integration connected successfully!');
        
        // Close the popup window
        window.close();
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to complete OAuth authorization');
        window.close();
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing Outlook Integration...</h2>
        <p className="text-muted-foreground">Please wait while we finalize your connection.</p>
      </div>
    </div>
  );
};