import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Settings, CheckCircle, AlertCircle, ExternalLink, Unlink, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OutlookIntegrationConsolidatedProps {
  onSyncComplete?: () => void;
}

export const OutlookIntegrationConsolidated = ({ onSyncComplete }: OutlookIntegrationConsolidatedProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);
  
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
        setTokenExpiry(data.token_expires_at);
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    }
  };

  // Listen for OAuth completion messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OUTLOOK_OAUTH_SUCCESS') {
        toast.success("Successfully connected to Outlook! 🎉");
        checkIntegrationStatus();
        setIsLoading(false);
      } else if (event.data.type === 'OUTLOOK_OAUTH_ERROR') {
        toast.error(event.data.error || "Failed to connect to Outlook");
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const handleOAuthConnection = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get OAuth configuration from our edge function
      const { data: config, error: configError } = await supabase.functions.invoke('outlook-oauth-config');
      
      if (configError) {
        throw new Error('Failed to get OAuth configuration: ' + configError.message);
      }
      
      // Build authorization URL
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: config.redirectUri,
        scope: config.scopes.join(' '),
        state: user.id, // Pass user ID in state for security
        response_mode: 'query'
      });
      
      const authUrl = `${config.authUrl}?${params.toString()}`;
      
      // Open popup window for OAuth using the same approach as Google Calendar
      const width = 500;
      const height = 650;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
      
      const popup = window.open(
        authUrl,
        'outlook_oauth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      if (!popup) {
        toast.error("Popup blocked. Please allow popups for this site and try again.");
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
      
    } catch (error) {
      console.error('OAuth connection error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to connect to Outlook");
      setIsLoading(false);
    }
  }, [user]);

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
      setTokenExpiry(null);
      
      toast.success("Outlook integration has been disconnected");
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error("Failed to disconnect Outlook integration");
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithOutlook = async () => {
    if (!user || !isConnected) return;
    
    setIsSyncing(true);
    
    try {
      console.log('🔄 Starting Outlook sync process...');
      
      // Call the outlook-calendar-sync edge function
      console.log('📞 Calling outlook-calendar-sync edge function...');
      const { data, error } = await supabase.functions.invoke('outlook-calendar-sync');
      
      console.log('📥 Edge function response:', { data, error });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        
        // Handle specific error types
        if (error.message.includes('Invalid token format')) {
          throw new Error('Authentication issue detected. Please reconnect your Outlook account.');
        } else if (error.message.includes('refresh access token')) {
          throw new Error('Token refresh failed. Please reconnect your Outlook account.');
        } else {
          throw new Error(error.message || 'Sync failed');
        }
      }
      
      // Update last sync time
      setLastSync(new Date().toISOString());
      
      const successMessage = data?.message || `Successfully synced! Imported: ${data?.imported || 0}, Exported: ${data?.exported || 0}`;
      console.log('✅ Sync completed:', successMessage);
      
      toast.success(successMessage);
      
      // Refresh integration status to get updated info
      await checkIntegrationStatus();
      
      // Call the optional sync complete callback
      onSyncComplete?.();
    } catch (error) {
      console.error('💥 Sync error:', error);
      
      // Provide more detailed error messages
      let errorMessage = "Failed to sync with Outlook";
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
          errorMessage = "Authentication failed - please reconnect your Outlook account";
          // Auto-disconnect if auth failed
          setIsConnected(false);
        } else if (error.message.includes('reconnect')) {
          errorMessage = error.message;
          // Auto-disconnect if we need to reconnect
          setIsConnected(false);
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
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
      
      toast.success(newAutoSyncState 
        ? "Auto-sync enabled - Calendar will sync automatically every 15 minutes" 
        : "Auto-sync disabled - Manual sync only");
    } catch (error) {
      console.error('Auto-sync toggle error:', error);
      toast.error("Failed to update auto-sync settings");
    }
  };

  // Check if token is expiring soon (within 1 day)
  const isTokenExpiringSoon = tokenExpiry && new Date(tokenExpiry).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Outlook Calendar Integration
          <Shield className="h-4 w-4 text-muted-foreground" />
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

          {isTokenExpiringSoon && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Token Expiring Soon
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
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Connect your Microsoft account using secure OAuth 2.0 authentication for seamless calendar synchronization.
            </AlertDescription>
          </Alert>
        )}

        {isConnected && isTokenExpiringSoon && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your authentication token is expiring soon. Please reconnect your account to continue syncing.
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
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              🎉 Your Microsoft account is securely connected! Events will sync {autoSyncEnabled ? 'automatically every 15 minutes' : 'manually when you click sync'}.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <strong>Secure OAuth 2.0 Integration</strong>
            </div>
            <p>• Uses Microsoft's official OAuth 2.0 for secure authentication</p>
            <p>• Your credentials are never stored - only secure, encrypted tokens</p>
            <p>• Tokens are automatically refreshed as needed</p>
            <p>• Full two-way sync: import from Outlook, export to Outlook</p>
          </div>
        </div>

        {tokenExpiry && (
          <div className="text-xs text-muted-foreground">
            Token expires: {new Date(tokenExpiry).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};