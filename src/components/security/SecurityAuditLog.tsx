import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface AuditLogEntry {
  id: string;
  action: string;
  table_name: string;
  timestamp: string;
  details: any;
  user_id: string;
}

export function SecurityAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isSystemAdmin } = useUserRole();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isSystemAdmin()) {
      fetchAuditLogs();
    }
  }, [user, isSystemAdmin]);

  if (!user || !isSystemAdmin()) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">System administrator access required to view audit logs.</p>
        </CardContent>
      </Card>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('SUSPICIOUS') || action.includes('SECURITY_BREACH')) {
      return 'destructive';
    }
    if (action.includes('ROLE_CHANGE') || action.includes('SENSITIVE_DATA')) {
      return 'secondary';
    }
    return 'outline';
  };

  const getSeverityIcon = (action: string) => {
    if (action.includes('SUSPICIOUS') || action.includes('SECURITY_BREACH')) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    return <Activity className="h-4 w-4 text-primary" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Security Audit Log</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading audit logs...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-muted-foreground text-center p-8">No audit logs found.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(log.action)}
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.table_name || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.details && typeof log.details === 'object' ? (
                        <code className="text-xs bg-muted p-1 rounded">
                          {JSON.stringify(log.details, null, 2).substring(0, 100)}
                          {JSON.stringify(log.details).length > 100 ? '...' : ''}
                        </code>
                      ) : (
                        log.details || '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}