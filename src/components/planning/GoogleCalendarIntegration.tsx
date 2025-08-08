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
      const { data, error } = await supabase
        .from('google_calendar_integration')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Google Calendar integration status:', error);
        return;
      }

      if (data) {
        setIsConnected(true);
        setLastSync(data.last_sync);
        setAccessToken(data.access_token || '');
        setRefreshToken(data.refresh_token || '');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  // Capture provider tokens after OAuth and save to DB
  useEffect(() => {
    if (!session || !user) return;
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
      const redirectTo = `${window.location.origin}/planning?google_connected=1`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
          },
          // Avoid redirecting inside the iframe; we'll handle it manually
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      const providerUrl = data?.url;
      if (providerUrl) {
        try {
          // If running inside an iframe, open a new tab to bypass sandbox restrictions
          const inIframe = window.self !== window.top;
          if (inIframe) {
            window.open(providerUrl, '_blank', 'noopener,noreferrer');
          } else {
            window.location.assign(providerUrl);
          }
        } catch {
          // Fallback if top navigation is blocked
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
    if (!accessToken.trim()) {
      toast({
        title: "Access token required",
        description: "Please enter your Google Calendar access token to sync.",
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

      // Update integration status
      const { error: upsertError } = await supabase
        .from('google_calendar_integration')
        .upsert({
          user_id: user?.id,
          access_token: accessToken.trim(),
          refresh_token: refreshToken.trim(),
          last_sync: new Date().toISOString(),
          is_active: true
        });

      if (upsertError) {
        console.error('Error updating integration:', upsertError);
      }

      setIsConnected(true);
      setLastSync(new Date().toISOString());
      
      toast({
        title: "Sync completed",
        description: `Successfully synced with Google Calendar. ${data?.synced || 0} events processed.`,
      });

      onSyncComplete?.();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync with Google Calendar. Please check your credentials and try again.",
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

        <Collapsible open={isSetupGuideVisible} onOpenChange={setIsSetupGuideVisible}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Setup Guide
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Google Calendar API Setup</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <Button variant="link" className="p-0 h-auto" onClick={() => copyToClipboard("https://console.developers.google.com/")}>Google Cloud Console</Button></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Google Calendar API</li>
                <li>Create OAuth 2.0 credentials (Web application)</li>
                <li>Add your domain to authorized origins</li>
                <li>Use the OAuth playground to get access and refresh tokens</li>
              </ol>
              
              <div className="mt-4">
                <h5 className="font-medium mb-2">OAuth Playground Steps:</h5>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Visit <Button variant="link" className="p-0 h-auto" onClick={() => copyToClipboard("https://developers.google.com/oauthplayground/")}>OAuth 2.0 Playground</Button></li>
                  <li>Select "Calendar API v3" and choose appropriate scopes</li>
                  <li>Click "Authorize APIs" and sign in</li>
                  <li>Exchange authorization code for tokens</li>
                  <li>Copy the access token and refresh token below</li>
                </ol>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="access-token">Access Token</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Enter your Google Calendar access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(accessToken)}
                  disabled={!accessToken}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="refresh-token">Refresh Token (Optional)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="refresh-token"
                  type="password"
                  placeholder="Enter your refresh token for automatic renewal"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(refreshToken)}
                  disabled={!refreshToken}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={syncWithGoogleCalendar} 
              disabled={isSyncing || isLoading || !accessToken.trim()}
              className="w-full"
            >
              {isSyncing ? "Syncing..." : "Sync with Google Calendar"}
            </Button>
          </div>
        ) : (
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
          <p><strong>Note:</strong> You can connect with one click using OAuth. Manual tokens are available above only for advanced troubleshooting.</p>
        </div>
      </CardContent>
    </Card>
  );
};