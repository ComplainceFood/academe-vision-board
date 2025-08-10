import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Calendar, CheckCircle, Clock, Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GoogleCalendarIntegrationProps {
  onSyncComplete?: () => void;
}

export const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({ onSyncComplete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isSetupGuideVisible, setIsSetupGuideVisible] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();

  useEffect(() => {
    if (user) {
      checkIntegrationStatus();
    }
  }, [user]);

  const checkIntegrationStatus = async () => {
    try {
      // Get the most recent integration record for this user
      const { data, error } = await supabase
        .from('google_calendar_integration')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking Google Calendar integration status:', error);
        // Show user-friendly error for common cases
        if (error.code === 'PGRST116') {
          // No integration found - this is normal for first-time users
          console.log('No Google Calendar integration found for user');
        }
        return;
      }

      if (data) {
        setIsConnected(data.is_active || false);
        setLastSync(data.last_sync);
        setAccessToken(data.access_token || '');
        setRefreshToken(data.refresh_token || '');
      }
    } catch (error) {
      console.error('Unexpected error checking integration status:', error);
    }
  };

  // Listen for completion flag from popup to refresh state without reloading
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sp_google_link_done' && e.newValue === '1') {
        // Clear the flag and refresh integration status
        localStorage.removeItem('sp_google_link_done');
        checkIntegrationStatus();
        setIsConnected(true);
        toast({
          title: 'Google connected',
          description: 'Calendar access granted. You can now sync.',
        });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Capture provider tokens after OAuth and save to DB
  useEffect(() => {
    if (!session || !user) return;

    // If a linking flow is in progress, let the global OAuthTokenCapture handle persistence
    try {
      const hasOriginal = typeof window !== 'undefined' && !!localStorage.getItem('sp_original_session');
      if (hasOriginal) return;
    } catch {}

    const providerToken = (session as any).provider_token as string | null;
    const providerRefreshToken = (session as any).provider_refresh_token as string | null;

    if (providerToken && !accessToken) {
      setAccessToken(providerToken);
      setRefreshToken(providerRefreshToken || '');

      (async () => {
        try {
          const { error } = await supabase
            .from('google_calendar_integration')
            .upsert(
              {
                user_id: user.id,
                access_token: providerToken,
                refresh_token: providerRefreshToken || null,
                is_active: true,
                updated_at: new Date().toISOString(),
              } as any,
              { onConflict: 'user_id' }
            );

          if (!error) {
            setIsConnected(true);
            toast({
              title: "Google connected",
              description: "Calendar access granted. You can now sync.",
            });
            checkIntegrationStatus();
          }
        } catch (e) {
          console.error('Failed to save Google tokens', e);
        }
      })();
    }
  }, [session, user]);

  const handleConnectGoogle = async () => {
    try {
      setIsLoading(true);

      // Save the current Supabase session so we can restore it after Google OAuth
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || !user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to your account before connecting Google.',
          variant: 'destructive',
        });
        return;
      }

      try {
        localStorage.setItem(
          'sp_original_session',
          JSON.stringify({
            access_token: currentSession.access_token,
            refresh_token: (currentSession as any).refresh_token,
            user_id: user.id,
            ts: Date.now(),
          })
        );
      } catch {}

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
          },
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      const providerUrl = data?.url;
      if (providerUrl) {
        const width = 500;
        const height = 650;
        const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
        const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
        const popup = window.open(
          providerUrl,
          'google_oauth',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        if (!popup) {
          // Fallback if popups are blocked
          window.open(providerUrl, '_blank', 'noopener,noreferrer');
        }
      }
    } catch (e: any) {
      toast({
        title: "Connection failed",
        description: e.message || "Could not start Google OAuth.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('google_calendar_integration')
        .update({
          is_active: false,
          access_token: null,
          refresh_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);
      if (error) throw error;

      setIsConnected(false);
      setAccessToken('');
      setRefreshToken('');
      toast({
        title: "Disconnected",
        description: "Google Calendar disconnected.",
      });
    } catch (e: any) {
      toast({
        title: "Failed to disconnect",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The text has been copied to your clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };
  const syncWithGoogleCalendar = async () => {
    const token = accessToken?.trim();
    if (!token) {
      toast({
        title: "Connect Google first",
        description: "Click Connect Google to authorize calendar access.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          accessToken: accessToken.trim(),
          refreshToken: refreshToken.trim() 
        }
      });

      if (error) {
        throw error;
      }

      // Update integration status with proper conflict handling
      const { error: upsertError } = await supabase
        .from('google_calendar_integration')
        .upsert(
          {
            user_id: user?.id,
            access_token: accessToken.trim(),
            refresh_token: refreshToken.trim(),
            last_sync: new Date().toISOString(),
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (upsertError) {
        console.error('Error updating integration:', upsertError);
        toast({
          title: "Update warning",
          description: "Sync completed but failed to update integration status.",
          variant: "destructive",
        });
      }

      setIsConnected(true);
      setLastSync(new Date().toISOString());
      
      toast({
        title: "Sync completed",
        description: `Successfully synced with Google Calendar. ${data?.synced || 0} events processed.`,
      });

      onSyncComplete?.();
    } catch (error: any) {
      console.error('Sync error:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to sync with Google Calendar.";
      if (error?.message?.includes('authorization')) {
        errorMessage = "Authorization expired. Please reconnect Google Calendar.";
        setIsConnected(false);
        setAccessToken('');
        setRefreshToken('');
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error?.message?.includes('quota') || error?.message?.includes('rate')) {
        errorMessage = "Google API rate limit reached. Please wait a few minutes and try again.";
      }
      
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar for two-way synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Connection Status</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </>
                )}
              </Badge>
              {lastSync && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Last sync: {new Date(lastSync).toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <Button variant="outline" onClick={handleDisconnectGoogle} disabled={isLoading || isSyncing}>
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnectGoogle} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect Google"}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
          Use the Connect Google button above for one-click OAuth. No manual setup required.
        </div>

{isConnected ? (
  <div className="space-y-4">
    <Button 
      onClick={syncWithGoogleCalendar} 
      disabled={isSyncing || isLoading}
      className="w-full"
    >
      {isSyncing ? "Syncing..." : "Sync now"}
    </Button>
  </div>
) : (
  <div className="text-sm text-muted-foreground">
    Click "Connect Google" above to authorize access. Once connected, return here to sync your calendar.
  </div>
)}

        <div className="text-xs text-muted-foreground mt-4">
          <p><strong>Note:</strong> You can connect with one click using OAuth. Manual tokens are available above only for advanced troubleshooting.</p>
        </div>
      </CardContent>
    </Card>
  );
};