import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, Clock, Database, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityStatus {
  https_enabled: boolean;
  auth_configured: boolean;
  last_checked: string;
  issues: string[];
  warnings: string[];
}

interface SecurityEvent {
  id: string;
  action: string;
  table_name: string;
  timestamp: string;
  details: any;
}

export function SecurityMonitor() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityStatus();
    fetchRecentEvents();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('validate_security_configuration');
      
      if (error) throw error;
      
      setSecurityStatus(data as unknown as SecurityStatus);
    } catch (error) {
      console.error('Error fetching security status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security status",
        variant: "destructive",
      });
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setRecentEvents(data || []);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    await Promise.all([fetchSecurityStatus(), fetchRecentEvents()]);
    setLoading(false);
    toast({
      title: "Security Status Updated",
      description: "Latest security information has been loaded",
    });
  };

  const getStatusColor = (issues: string[], warnings: string[]): "default" | "destructive" | "outline" | "secondary" => {
    if (issues.length > 0) return "destructive";
    if (warnings.length > 0) return "secondary";
    return "default";
  };

  const getStatusIcon = (issues: string[], warnings: string[]) => {
    if (issues.length > 0) return <AlertTriangle className="h-4 w-4" />;
    if (warnings.length > 0) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 animate-pulse" />
              <span>Loading security status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">Security Status</CardTitle>
            <CardDescription>
              Current security configuration and health
            </CardDescription>
          </div>
          <Button onClick={refreshStatus} variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {securityStatus && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Status</span>
                <Badge 
                  variant={getStatusColor(securityStatus.issues, securityStatus.warnings)}
                  className="flex items-center gap-1"
                >
                  {getStatusIcon(securityStatus.issues, securityStatus.warnings)}
                  {securityStatus.issues.length === 0 && securityStatus.warnings.length === 0
                    ? "Secure"
                    : securityStatus.issues.length > 0
                    ? "Issues Found"
                    : "Warnings"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">HTTPS</span>
                  <Badge variant={securityStatus.https_enabled ? "default" : "destructive"}>
                    {securityStatus.https_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Authentication</span>
                  <Badge variant={securityStatus.auth_configured ? "default" : "destructive"}>
                    {securityStatus.auth_configured ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </div>

              {securityStatus.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Issues Found:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {securityStatus.issues.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {securityStatus.warnings.length > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Warnings:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {securityStatus.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground">
                Last checked: {new Date(securityStatus.last_checked).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Security Events</CardTitle>
          <CardDescription>
            Latest security audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No recent security events found
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      {event.action}
                    </Badge>
                    <span className="text-sm font-medium">{event.table_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Configuration Required */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-warning">Manual Configuration Required</CardTitle>
          <CardDescription>
            These settings require manual configuration in your Supabase dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical Settings (Requires Immediate Action):</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                  <li>
                    <strong>Enable Leaked Password Protection:</strong> Go to Supabase Dashboard → 
                    Authentication → Settings → Enable "Leaked password protection"
                  </li>
                  <li>
                    <strong>Reduce OTP Expiry Time:</strong> In Authentication → Settings → 
                    Change OTP expiry to 10 minutes maximum
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}