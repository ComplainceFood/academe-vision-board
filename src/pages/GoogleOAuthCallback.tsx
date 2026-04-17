
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_OAUTH_ERROR', error: 'Authorization was denied or failed.' },
          window.location.origin
        );
        window.close();
      }
      return;
    }

    // Validate state matches what we stored to prevent CSRF
    const storedState = sessionStorage.getItem('google_oauth_state');
    if (!state || !storedState || state !== storedState) {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_OAUTH_ERROR', error: 'Invalid OAuth state. Please try again.' },
          window.location.origin
        );
        window.close();
      }
      return;
    }
    sessionStorage.removeItem('google_oauth_state');

    if (code) {
      exchangeCodeForTokens(code);
    }
  }, [searchParams]);

  const exchangeCodeForTokens = async (code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('google-oauth-exchange', {
        body: { code },
      });

      if (error) throw error;

      if (data?.success) {
        // Signal success only — tokens are persisted server-side, never sent via postMessage
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS' }, window.location.origin);
          window.close();
        }
      } else {
        throw new Error('Failed to complete Google Calendar authorization.');
      }
    } catch {
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_OAUTH_ERROR', error: 'Failed to complete authorization. Please try again.' },
          window.location.origin
        );
        window.close();
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Processing Google Calendar authorization...</p>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
