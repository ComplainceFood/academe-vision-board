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
        console.error('OAuth error:', error);
        // Communicate error to parent window before closing
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'OUTLOOK_OAUTH_ERROR', 
            error: error 
          }, '*');
        }
        toast.error('OAuth authorization failed: ' + error);
        setTimeout(() => window.close(), 1000);
        return;
      }

      if (!code || !state) {
        const errorMsg = 'Missing authorization code or state parameter';
        console.error('OAuth error:', errorMsg);
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'OUTLOOK_OAUTH_ERROR', 
            error: errorMsg 
          }, '*');
        }
        toast.error(errorMsg);
        setTimeout(() => window.close(), 1000);
        return;
      }

      try {
        console.log('Starting OAuth token exchange...', { code: code.substring(0, 10) + '...', state });
        
        // Exchange code for tokens using our edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('outlook-oauth-exchange', {
          body: { code, state }
        });

        console.log('Token exchange response:', { data, error: exchangeError });

        if (exchangeError) {
          throw new Error(exchangeError.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Unknown error during token exchange');
        }

        // Communicate success to parent window
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'OUTLOOK_OAUTH_SUCCESS',
            data: data
          }, '*');
        }

        toast.success('Outlook integration connected successfully!');
        
        // Close the popup window after a short delay
        setTimeout(() => window.close(), 1000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to complete OAuth authorization';
        
        // Communicate error to parent window
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'OUTLOOK_OAUTH_ERROR', 
            error: errorMessage 
          }, '*');
        }
        
        toast.error(errorMessage);
        setTimeout(() => window.close(), 1000);
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