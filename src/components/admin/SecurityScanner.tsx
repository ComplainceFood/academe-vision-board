import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface SecurityIssue {
  id: string;
  level: 'CRITICAL' | 'WARN' | 'INFO';
  title: string;
  description: string;
  category: string;
  fixed: boolean;
  fixUrl?: string;
}

export function SecurityScanner() {
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const { isSystemAdmin, loading } = useUserRole();

  const runSecurityScan = async () => {
    if (!isSystemAdmin()) return;
    
    setScanning(true);
    try {
      // Simulate security scanning - in a real app this would call a security scanner function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock security issues - replace with actual scanner results
      const mockIssues: SecurityIssue[] = [
        {
          id: 'leaked-password-protection',
          level: 'WARN',
          title: 'Leaked Password Protection Disabled',
          description: 'Leaked password protection is currently disabled in Supabase Authentication settings.',
          category: 'AUTHENTICATION',
          fixed: false,
          fixUrl: 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
        },
        {
          id: 'otp-expiry',
          level: 'WARN',
          title: 'OTP Expiry Too Long',
          description: 'OTP expiry time exceeds recommended threshold (should be ≤ 10 minutes).',
          category: 'AUTHENTICATION',
          fixed: false,
          fixUrl: 'https://supabase.com/docs/guides/platform/going-into-prod#security'
        },
        {
          id: 'extensions-in-public',
          level: 'WARN',
          title: 'Extensions in Public Schema',
          description: 'Some PostgreSQL extensions are installed in the public schema, which poses security risks.',
          category: 'DATABASE',
          fixed: false,
          fixUrl: 'https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public'
        },
        {
          id: 'role-security-fixed',
          level: 'INFO',
          title: 'Role Security Hardened',
          description: 'User role privilege escalation vulnerability has been fixed with proper RLS policies.',
          category: 'ACCESS_CONTROL',
          fixed: true
        }
      ];
      
      setIssues(mockIssues);
      setLastScan(new Date());
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (isSystemAdmin() && !loading) {
      runSecurityScan();
    }
  }, [isSystemAdmin, loading]);

  if (loading) {
    return <div>Loading security scanner...</div>;
  }

  if (!isSystemAdmin()) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Security scanner is only available to system administrators.
        </AlertDescription>
      </Alert>
    );
  }

  const criticalIssues = issues.filter(issue => issue.level === 'CRITICAL' && !issue.fixed);
  const warningIssues = issues.filter(issue => issue.level === 'WARN' && !issue.fixed);
  const fixedIssues = issues.filter(issue => issue.fixed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Scanner</h2>
          <p className="text-muted-foreground">
            Monitor and resolve security vulnerabilities in your application
          </p>
        </div>
        <Button onClick={runSecurityScan} disabled={scanning}>
          {scanning ? "Scanning..." : "Run Security Scan"}
        </Button>
      </div>

      {lastScan && (
        <p className="text-sm text-muted-foreground">
          Last scan: {lastScan.toLocaleString()}
        </p>
      )}

      {/* Security Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold">Critical Issues</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{criticalIssues.length}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="font-semibold">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-warning">{warningIssues.length}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="font-semibold">Fixed</span>
          </div>
          <p className="text-2xl font-bold text-success">{fixedIssues.length}</p>
        </div>
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-destructive">Critical Issues</h3>
          {criticalIssues.map((issue) => (
            <Alert key={issue.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                {issue.title}
                <Badge variant="destructive">{issue.category}</Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                {issue.description}
                {issue.fixUrl && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={issue.fixUrl} target="_blank" rel="noopener noreferrer">
                        View Fix Guide <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Warning Issues */}
      {warningIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-warning">Warnings</h3>
          {warningIssues.map((issue) => (
            <Alert key={issue.id}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                {issue.title}
                <Badge variant="secondary">{issue.category}</Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                {issue.description}
                {issue.fixUrl && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={issue.fixUrl} target="_blank" rel="noopener noreferrer">
                        View Fix Guide <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Fixed Issues */}
      {fixedIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-success">Recently Fixed</h3>
          {fixedIssues.map((issue) => (
            <Alert key={issue.id}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                {issue.title}
                <Badge variant="outline">{issue.category}</Badge>
              </AlertTitle>
              <AlertDescription>{issue.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Manual Configuration Required */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Manual Supabase Configuration Required</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Some security improvements require manual configuration in your Supabase dashboard:</p>
          <div className="space-y-1">
            <p><strong>1. Enable Leaked Password Protection:</strong></p>
            <p className="text-sm ml-4">Go to Authentication → Settings → Password Protection</p>
            
            <p><strong>2. Reduce OTP Expiry Time:</strong></p>
            <p className="text-sm ml-4">Go to Authentication → Settings → Auth → OTP expiry (set to 600 seconds or less)</p>
          </div>
          <Button variant="outline" size="sm" asChild className="mt-2">
            <a href="https://supabase.com/dashboard/project/ljxwljvodiwtmkiseukb/auth/providers" target="_blank" rel="noopener noreferrer">
              Open Supabase Dashboard <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}