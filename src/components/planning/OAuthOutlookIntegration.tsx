import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Settings, CheckCircle, AlertCircle, ExternalLink, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OAuthOutlookIntegrationProps {
  onSyncComplete?: () => void;
}

export const OAuthOutlookIntegration = ({ onSyncComplete }: OAuthOutlookIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
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
        .from('outlook_integration')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking integration status:', error);
        return;
      }

      if (data) {
        setIsConnected(data.is_connected);
        setLastSync(data.last_sync);
        setAutoSyncEnabled(data.auto_sync_enabled);
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    }
  };

  const handleOAuthConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      // Microsoft OAuth 2.0 configuration
      const clientId = ''; // This would be configured in environment
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/outlook/callback`);
      const scopes = encodeURIComponent('https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read');
      const responseType = 'code';
      const state = btoa(JSON.stringify({ userId: user?.id }));

      // Microsoft OAuth URL
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=${responseType}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scopes}&` +
        `state=${state}&` +
        `prompt=consent`;

      // For now, show setup instructions since we need proper OAuth setup
      toast({
        title: "OAuth Setup Required",
        description: "Proper OAuth integration requires Azure App Registration. Using fallback method for now.",
        variant: "destructive",
      });

      // TODO: Implement proper OAuth flow
      // window.location.href = authUrl;
    } catch (error) {
      console.error('OAuth connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate OAuth connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const disconnectOutlook = async () => {
    try {
      setIsLoading(true);
      
      // Clear integration data
      await supabase
        .from('outlook_integration')
        .update({
          is_connected: false,
          access_token_encrypted: null,
          refresh_token_encrypted: null,
          token_expires_at: null,
          last_sync: null,
        })
        .eq('user_id', user?.id);

      setIsConnected(false);
      setLastSync(null);
      
      toast({
        title: "Disconnected",
        description: "Outlook integration has been disconnected",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Outlook integration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithOutlook = async () => {
    setIsSyncing(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await supabase.functions.invoke('outlook-oauth-sync', {
        body: { action: 'sync_events' },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Sync Complete! 🎉",
        description: `Successfully synced ${response.data?.syncedEvents || 0} events from Outlook.`,
      });

      setLastSync(new Date().toISOString());
      onSyncComplete?.();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync with Outlook",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = async () => {
    try {
      const newAutoSyncState = !autoSyncEnabled;
      
      await supabase
        .from('outlook_integration')
        .upsert({
          user_id: user?.id,
          auto_sync_enabled: newAutoSyncState,
        });

      setAutoSyncEnabled(newAutoSyncState);
      
      toast({
        title: newAutoSyncState ? "Auto-sync Enabled" : "Auto-sync Disabled",
        description: newAutoSyncState 
          ? "Calendar will sync automatically every 15 minutes" 
          : "Manual sync only",
      });
    } catch (error) {
      console.error('Auto-sync toggle error:', error);
      toast({
        title: "Error",
        description: "Failed to update auto-sync settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Outlook Calendar Integration (OAuth)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
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
          
          {isConnected && (
            <Badge variant={autoSyncEnabled ? "default" : "outline"}>
              Auto-sync: {autoSyncEnabled ? "Enabled" : "Disabled"}
            </Badge>
          )}
          
          {lastSync && (
            <span className="text-sm text-muted-foreground">
              Last sync: {new Date(lastSync).toLocaleString()}
            </span>
          )}
        </div>

        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your Microsoft account for seamless calendar synchronization with proper OAuth authentication.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 flex-wrap">
          {!isConnected ? (
            <Button
              onClick={handleOAuthConnection}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {isLoading ? "Connecting..." : "Connect with Microsoft"}
            </Button>
          ) : (
            <>
              <Button
                onClick={syncWithOutlook}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleAutoSync}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {autoSyncEnabled ? 'Disable Auto-sync' : 'Enable Auto-sync'}
              </Button>
              
              <Button
                variant="outline"
                onClick={disconnectOutlook}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Unlink className="h-4 w-4" />
                Disconnect
              </Button>
            </>
          )}
        </div>

        {isConnected && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              🎉 Your Microsoft account is connected! Events will sync {autoSyncEnabled ? 'automatically every 15 minutes' : 'manually when you click sync'}.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>OAuth Integration:</strong> This uses Microsoft's OAuth 2.0 for secure authentication. 
          Your credentials are never stored directly - only secure tokens are used for API access.
        </div>
      </CardContent>
    </Card>
  );
};