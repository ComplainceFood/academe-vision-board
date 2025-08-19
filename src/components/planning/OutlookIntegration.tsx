import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Settings, CheckCircle, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OutlookIntegrationProps {
  onSyncComplete?: () => void;
}

export const OutlookIntegration = ({ onSyncComplete }: OutlookIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [showSetup, setShowSetup] = useState(false);
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
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const syncWithOutlook = async () => {
    if (!accessToken) {
      toast({
        title: "Access Token Required",
        description: "Please get an access token from Microsoft Graph Explorer first.",
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

      const response = await supabase.functions.invoke('outlook-calendar-sync', {
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

      // Update integration status
      await supabase
        .from('outlook_integration')
        .upsert({
          user_id: user?.id,
          is_connected: true,
          last_sync: new Date().toISOString(),
        });

      toast({
        title: "Sync Complete! 🎉",
        description: `Successfully synced ${response.data?.syncedEvents || 0} events from Outlook.`,
      });

      setLastSync(new Date().toISOString());
      setIsConnected(true);
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Follow the simple steps below to connect your Outlook calendar and sync your events automatically.
            </AlertDescription>
          </Alert>
        )}

        {!isConnected && !showSetup && (
          <div className="text-center py-6">
            <Button 
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2"
              size="lg"
            >
              <Settings className="h-4 w-4" />
              Set Up Outlook Sync (One-Time Setup)
            </Button>
          </div>
        )}

        {showSetup && !isConnected && (
          <div className="space-y-6 border rounded-lg p-4 bg-muted/50">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Setup Guide</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Get Your Access Token</p>
                    <p className="text-sm text-muted-foreground">
                      Click the button below to open Microsoft Graph Explorer where you can get a temporary access token:
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://developer.microsoft.com/en-us/graph/graph-explorer', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Graph Explorer
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Sign In & Get Token</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Click "Sign in to Graph Explorer"</p>
                      <p>• Sign in with your Microsoft account</p>
                      <p>• In the request URL, change it to:</p>
                      <div className="bg-background p-2 rounded border font-mono text-xs flex items-center gap-2">
                        <span className="flex-1">GET https://graph.microsoft.com/v1.0/me/calendar/events</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard('GET https://graph.microsoft.com/v1.0/me/calendar/events')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p>• Click "Run query"</p>
                      <p>• Copy the "Access token" from the "Access token" tab</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Paste Token & Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Paste the access token below and click "Sync Now":
                    </p>
                    <div className="space-y-2">
                      <input
                        type="password"
                        className="w-full p-3 border rounded-md"
                        placeholder="Paste your access token here..."
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
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
          
          {showSetup && (
            <Button
              variant="outline"
              onClick={() => setShowSetup(false)}
            >
              Hide Setup
            </Button>
          )}
        </div>

        {isConnected && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              🎉 Great! Your Outlook calendar is connected. New events you create here can be synced to Outlook, and events from Outlook will appear in your calendar.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Note:</strong> This uses a temporary access token for quick setup. For permanent integration, you would need to set up an Azure app registration with proper OAuth flow.
        </div>
      </CardContent>
    </Card>
  );
};