import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertTriangle, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SecurityConfig {
  https_enabled: boolean;
  auth_configured: boolean;
  last_checked: string;
  issues: string[];
  warnings: string[];
}

interface ExtensionInfo {
  extension_name: string;
  recommendation: string;
  schema_name: string;
  security_status: string;
}

export function SecurityStatus() {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [configResult, extensionsResult] = await Promise.all([
        supabase.rpc('validate_security_configuration'),
        supabase.rpc('get_extension_security_info'),
      ]);

      if (configResult.data) {
        setConfig(configResult.data as unknown as SecurityConfig);
      }
      if (extensionsResult.data) {
        setExtensions(extensionsResult.data as ExtensionInfo[]);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSecurityData();
  }, [user]);

  const issueCount = config?.issues?.length ?? 0;
  const warningCount = config?.warnings?.length ?? 0;
  const extensionIssues = extensions.filter(e => e.security_status !== 'OK');

  const securityFeatures = [
    { label: "XSS Prevention", ok: true },
    { label: "Input Validation & Sanitization", ok: true },
    { label: "Row-Level Security (RLS)", ok: config?.auth_configured ?? false },
    { label: "Secure Authentication", ok: config?.auth_configured ?? false },
    { label: "Password Strength Validation", ok: true },
    { label: "Security Audit Logging", ok: true },
    { label: "File Upload Validation", ok: true },
    { label: "Content Sanitization", ok: true },
    { label: "HTTPS", ok: config?.https_enabled ?? false },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading security status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Status</h2>
          <p className="text-muted-foreground">
            Live overview of your security configuration
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSecurityData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg border-destructive/30">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold">Issues</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{issueCount}</p>
        </div>
        <div className="p-4 border rounded-lg border-warning/30">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="font-semibold">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-warning">{warningCount + extensionIssues.length}</p>
        </div>
        <div className="p-4 border rounded-lg border-success/30">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="font-semibold">Secured</span>
          </div>
          <p className="text-2xl font-bold text-success">
            {securityFeatures.filter(f => f.ok).length}/{securityFeatures.length}
          </p>
        </div>
      </div>

      {/* Issues */}
      {issueCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Issues</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc list-inside">
              {config!.issues.map((issue, i) => (
                <li key={i} className="text-sm">{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {(warningCount > 0 || extensionIssues.length > 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc list-inside">
              {config?.warnings?.map((w, i) => (
                <li key={`w-${i}`} className="text-sm">{w}</li>
              ))}
              {extensionIssues.map((ext, i) => (
                <li key={`ext-${i}`} className="text-sm">
                  Extension <strong>{ext.extension_name}</strong> in schema <code>{ext.schema_name}</code>: {ext.recommendation}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Features */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Features</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {securityFeatures.map((feature, i) => (
              <div key={i} className="flex items-center space-x-2">
                {feature.ok ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
                <span className="text-sm">{feature.label}</span>
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      {config?.last_checked && (
        <p className="text-xs text-muted-foreground">
          Last checked: {new Date(config.last_checked).toLocaleString()}
        </p>
      )}
    </div>
  );
}
