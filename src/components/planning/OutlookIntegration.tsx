import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OutlookIntegrationProps {
  onSyncComplete?: () => void;
}

export const OutlookIntegration = ({ onSyncComplete }: OutlookIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
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
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking integration status:', error);
        return;
      }

      if (data) {
        setIsConnected(data.is_connected);
        setLastSync(data.last_sync);
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    }
  };

  const handleMicrosoftAuth = () => {
    // Redirect to Microsoft OAuth
    const clientId = "YOUR_AZURE_CLIENT_ID"; // This should be set by the user
    const redirectUri = window.location.origin + "/outlook-callback";
    const scope = "https://graph.microsoft.com/Calendars.ReadWrite offline_access";
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_mode=query`;

    window.open(authUrl, 'outlook-auth', 'width=500,height=600');
  };

  const syncWithOutlook = async () => {
    if (!accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please connect to Outlook first or provide an access token.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await supabase.functions.invoke('outlook-sync', {
        body: {
          action: 'sync_events',
          accessToken: accessToken
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Update last sync time
      await supabase
        .from('outlook_integration')
        .upsert({
          user_id: user?.id,
          is_connected: true,
          last_sync: new Date().toISOString(),
        });

      toast({
        title: "Sync Complete",
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

  const createOutlookEvent = async (eventData: any) => {
    if (!accessToken) {
      return false;
    }

    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session?.access_token) {
        return false;
      }

      const response = await supabase.functions.invoke('outlook-sync', {
        body: {
          action: 'create_event',
          eventData: {
            ...eventData,
            start_date: new Date(eventData.date + 'T' + (eventData.time || '09:00')).toISOString(),
            end_date: new Date(eventData.date + 'T' + (eventData.end_time || '10:00')).toISOString(),
          },
          accessToken: accessToken
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      return !response.error;
    } catch (error) {
      console.error('Error creating Outlook event:', error);
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Outlook Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
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
            <span className="text-sm text-muted-foreground">
              Last sync: {new Date(lastSync).toLocaleString()}
            </span>
          )}
        </div>

        {!isConnected && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Outlook calendar to sync events automatically.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Token (temporary)</label>
              <input
                type="password"
                className="w-full p-2 border rounded"
                placeholder="Paste your Microsoft Graph access token here"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your access token from{' '}
                <a 
                  href="https://developer.microsoft.com/en-us/graph/graph-explorer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Microsoft Graph Explorer
                </a>
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={syncWithOutlook}
            disabled={isSyncing || !accessToken}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          
          {!isConnected && (
            <Button
              variant="outline"
              onClick={handleMicrosoftAuth}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Connect Outlook
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Note:</strong> For full OAuth integration, you'll need to set up an Azure app registration 
          and configure the redirect URI. For now, you can use a Graph Explorer access token for testing.
        </div>
      </CardContent>
    </Card>
  );
};