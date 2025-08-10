
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkIntegrationStatus();
    }
  }, [user]);

  const checkIntegrationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('google_calendar_integration')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Google Calendar integration status:', error);
        return;
      }

      if (data) {
        setIsConnected(true);
        setLastSync(data.last_sync);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Unexpected error checking integration status:', error);
    }
  };

  // Listen for OAuth completion messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { accessToken, refreshToken } = event.data;
        handleOAuthSuccess(accessToken, refreshToken);
      } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
        toast({
          title: "Connection failed",
          description: event.data.error || "Failed to connect to Google Calendar",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const handleOAuthSuccess = async (accessToken: string, refreshToken: string) => {
    try {
      const { error } = await supabase
        .from('google_calendar_integration')
        .upsert(
          {
            user_id: user?.id,
            access_token: accessToken,
            refresh_token: refreshToken,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (!error) {
        setIsConnected(true);
        toast({
          title: "Google Calendar connected",
          description: "Calendar access granted. You can now sync your events.",
        });
        checkIntegrationStatus();
      }
    } catch (e) {
      console.error('Failed to save Google tokens', e);
      toast({
        title: "Connection failed",
        description: "Failed to save calendar authorization.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to your account before connecting Google Calendar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Fetch public OAuth config from edge function and build URL
    const { data: cfg, error } = await supabase.functions.invoke('google-oauth-config', { body: {} });
    if (error || !cfg?.clientId) {
      toast({
        title: 'Configuration error',
        description: 'Google OAuth is not configured. Please try again later.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const clientId = cfg.clientId as string;
    const redirectUri = (cfg.redirectUri as string) || `${window.location.origin}/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(user.id)}`;

    // Open popup for OAuth
    const width = 500;
    const height = 650;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    
    const popup = window.open(
      oauthUrl,
      'google_calendar_auth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Monitor popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
      }
    }, 1000);
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
      setLastSync(null);
      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected.",
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

  const syncWithGoogleCalendar = async () => {
    if (!isConnected) {
      toast({
        title: "Connect Google Calendar first",
        description: "Please connect your Google Calendar before syncing.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setLastSync(new Date().toISOString());
      
      toast({
        title: "Sync completed",
        description: `Successfully synced with Google Calendar. ${data?.synced || 0} events processed.`,
      });

      onSyncComplete?.();
    } catch (error: any) {
      console.error('Sync error:', error);
      
      let errorMessage = "Failed to sync with Google Calendar.";
      if (error?.message?.includes('authorization')) {
        errorMessage = "Authorization expired. Please reconnect Google Calendar.";
        setIsConnected(false);
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
          {isConnected 
            ? "Your Google Calendar is connected. Click 'Sync now' to synchronize events."
            : "Click 'Connect Google' to authorize calendar access without changing your account."
          }
        </div>

        {isConnected && (
          <div className="space-y-4">
            <Button 
              onClick={syncWithGoogleCalendar} 
              disabled={isSyncing || isLoading}
              className="w-full"
            >
              {isSyncing ? "Syncing..." : "Sync now"}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          <p><strong>Note:</strong> This only authorizes calendar access and won't change your current sign-in status.</p>
        </div>
      </CardContent>
    </Card>
  );
};
