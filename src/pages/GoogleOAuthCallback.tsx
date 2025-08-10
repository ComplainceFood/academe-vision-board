
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // This contains the user ID

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: error
        }, window.location.origin);
        window.close();
      }
      return;
    }

    if (code && state) {
      // Exchange code for tokens
      exchangeCodeForTokens(code, state);
    }
  }, [searchParams]);

  const exchangeCodeForTokens = async (code: string, userId: string) => {
    try {
      // This should be handled by an edge function for security
      const response = await fetch('/api/google-oauth-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });

      const data = await response.json();

      if (data.success) {
        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_SUCCESS',
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          }, window.location.origin);
          window.close();
        }
      } else {
        throw new Error(data.error || 'Failed to exchange code for tokens');
      }
    } catch (error) {
      console.error('OAuth exchange error:', error);
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, window.location.origin);
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
