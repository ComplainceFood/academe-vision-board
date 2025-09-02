import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SecurityStatus {
  https_enabled: boolean;
  auth_configured: boolean;
  issues: string[];
  warnings: string[];
  last_checked: string;
}

export function SecurityMonitor() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkSecurityConfiguration = async () => {
    try {
      setLoading(true);
      
      // Call the security validation function
      const { data, error } = await supabase.rpc('validate_security_configuration');
      
      if (error) throw error;
      
      // Add client-side checks
      const parsedData = data as any || {};
      const clientChecks = {
        https_enabled: window.location.protocol === 'https:',
        auth_configured: parsedData.auth_configured || false,
        issues: parsedData.issues || [],
        warnings: parsedData.warnings || [],
        last_checked: parsedData.last_checked || new Date().toISOString()
      };
      
      // Check for common security headers
      if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        clientChecks.warnings.push('Content Security Policy not detected');
      }
      
      setSecurityStatus(clientChecks);
    } catch (error) {
      console.error('Error checking security configuration:', error);
      setSecurityStatus({
        https_enabled: window.location.protocol === 'https:',
        auth_configured: !!user,
        issues: ['Failed to validate database security configuration'],
        warnings: [],
        last_checked: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkSecurityConfiguration();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Authentication required to view security status.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking security configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalIssues = securityStatus?.issues?.length || 0;
  const warnings = securityStatus?.warnings?.length || 0;
  const overallStatus = criticalIssues === 0 ? (warnings === 0 ? 'secure' : 'warning') : 'critical';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Monitor</span>
            <Badge variant={overallStatus === 'secure' ? 'default' : overallStatus === 'warning' ? 'secondary' : 'destructive'}>
              {overallStatus.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {securityStatus?.https_enabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">HTTPS Enabled</span>
            </div>
            <div className="flex items-center space-x-2">
              {securityStatus?.auth_configured ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Authentication Active</span>
            </div>
          </div>

          {criticalIssues > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{criticalIssues} Critical Issue{criticalIssues > 1 ? 's' : ''} Found:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {securityStatus?.issues?.map((issue, index) => (
                    <li key={index} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {warnings > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{warnings} Warning{warnings > 1 ? 's' : ''}:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {securityStatus?.warnings?.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {criticalIssues === 0 && warnings === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All security checks passed. Your application is properly secured.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-muted-foreground">
              Last checked: {securityStatus?.last_checked ? new Date(securityStatus.last_checked).toLocaleString() : 'Never'}
            </p>
            <Button variant="outline" size="sm" onClick={checkSecurityConfiguration}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}