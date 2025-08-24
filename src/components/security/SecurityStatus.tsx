import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Lock } from "lucide-react";

export function SecurityStatus() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Status</h2>
        <p className="text-muted-foreground">
          Overview of implemented security measures and critical fixes
        </p>
      </div>

      {/* Security Fixes Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg border-success">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="font-semibold text-success">Critical Fix Applied</span>
          </div>
          <h3 className="font-medium">Privilege Escalation</h3>
          <p className="text-sm text-muted-foreground">
            Fixed dangerous user role update vulnerability
          </p>
        </div>

        <div className="p-4 border rounded-lg border-success">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="font-semibold text-success">Security Hardened</span>
          </div>
          <h3 className="font-medium">Role Management</h3>
          <p className="text-sm text-muted-foreground">
            Implemented secure role assignment with audit logging
          </p>
        </div>

        <div className="p-4 border rounded-lg border-success">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="font-semibold text-success">Protection Active</span>
          </div>
          <h3 className="font-medium">Rate Limiting</h3>
          <p className="text-sm text-muted-foreground">
            Added rate limiting for sensitive operations
          </p>
        </div>
      </div>

      {/* Security Features */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Features Implemented</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">XSS Prevention</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Input Validation & Sanitization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Row-Level Security (RLS)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Secure Authentication</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Password Strength Validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Security Audit Logging</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">File Upload Validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Content Sanitization</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Manual Configuration Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Manual Configuration Required</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>The following security improvements require manual configuration in Supabase:</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Authentication</Badge>
              <span className="text-sm">Enable Leaked Password Protection</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Authentication</Badge>
              <span className="text-sm">Reduce OTP Expiry Time (≤ 10 minutes)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Database</Badge>
              <span className="text-sm">Move Extensions from Public Schema</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Contact your system administrator to complete these configurations.
          </p>
        </AlertDescription>
      </Alert>

      {/* Security Best Practices */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Security Best Practices Implemented</AlertTitle>
        <AlertDescription className="mt-2">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>All user inputs are validated and sanitized before processing</li>
            <li>Database queries use parameterized statements to prevent SQL injection</li>
            <li>Row-Level Security policies ensure users can only access their own data</li>
            <li>Role-based access control with hierarchical permissions</li>
            <li>Secure session management with automatic token refresh</li>
            <li>File uploads are validated for type, size, and malicious content</li>
            <li>Security events are logged for monitoring and auditing</li>
            <li>Rate limiting prevents abuse of sensitive operations</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}