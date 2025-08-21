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

        toast.success('Outlook integration connected successfully!');
        
        // Check if this is a popup (has opener) or full redirect
        if (window.opener) {
          // Popup mode: communicate success to parent window
          window.opener.postMessage({ 
            type: 'OUTLOOK_OAUTH_SUCCESS',
            data: data
          }, '*');
          setTimeout(() => window.close(), 1000);
        } else {
          // Full redirect mode: redirect back to the planning page
          const returnUrl = sessionStorage.getItem('outlook_oauth_return_url') || '/planning';
          sessionStorage.removeItem('outlook_oauth_return_url');
          
          // Delay redirect to show success message
          setTimeout(() => {
            window.location.href = returnUrl;
          }, 2000);
        }
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to complete OAuth authorization';
        
        if (window.opener) {
          // Popup mode: communicate error to parent window
          window.opener.postMessage({ 
            type: 'OUTLOOK_OAUTH_ERROR', 
            error: errorMessage 
          }, '*');
          setTimeout(() => window.close(), 1000);
        } else {
          // Full redirect mode: show error and redirect back
          toast.error(errorMessage);
          const returnUrl = sessionStorage.getItem('outlook_oauth_return_url') || '/planning';
          sessionStorage.removeItem('outlook_oauth_return_url');
          
          setTimeout(() => {
            window.location.href = returnUrl;
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold mb-2">Completing Outlook Integration...</h2>
        <p className="text-muted-foreground">Please wait while we finalize your connection.</p>
      </div>
    </div>
  );
};