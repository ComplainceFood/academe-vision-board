import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Users, ShieldAlert, Search, Crown, BarChart3, RefreshCw,
  FileCheck, Database, ToggleLeft, Edit2
} from 'lucide-react';
import { AdminSeedDataManager } from '@/components/admin/AdminSeedDataManager';
import { FeatureFlagsAdmin } from '@/components/admin/FeatureFlagsAdmin';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

interface UserSubscription {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  notes: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface UserAgreementWithEmail {
  id: string;
  user_id: string;
  agreement_type: string;
  version: string;
  agreed_at: string;
  user_agent: string | null;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise (internal)' },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'expired', label: 'Expired', color: 'bg-muted text-muted-foreground' },
  { value: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
];

const TIER_BADGE: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function AdminUsersPage() {
  const { isSystemAdmin, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [agreements, setAgreements] = useState<UserAgreementWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTier, setEditTier] = useState('free');
  const [editStatus, setEditStatus] = useState('active');
  const [editRole, setEditRole] = useState('primary_user');
  const [editNotes, setEditNotes] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profilesRes, subsRes, rolesRes, agreementsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, first_name, last_name, email, department, position, avatar_url, created_at, last_login_at'),
        supabase.from('user_subscriptions').select('*'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_agreements_with_email' as any).select('id, user_id, agreement_type, version, agreed_at, user_agent, email, display_name, first_name, last_name').order('agreed_at', { ascending: false }),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (subsRes.data) setSubscriptions(subsRes.data as UserSubscription[]);
      if (rolesRes.data) setRoles(rolesRes.data);
      if (agreementsRes.data) setAgreements(agreementsRes.data as UserAgreementWithEmail[]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !roleLoading && isSystemAdmin()) {
      fetchData();
    }
  }, [user, roleLoading]);

  if (roleLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isSystemAdmin()) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">Only system administrators can access user management.</p>
        </div>
      </MainLayout>
    );
  }

  const getUserSub = (userId: string) => subscriptions.find(s => s.user_id === userId);
  const getUserRole = (userId: string) => roles.find(r => r.user_id === userId);
  const getStatusInfo = (status: string) => SUBSCRIPTION_STATUSES.find(s => s.value === status) || SUBSCRIPTION_STATUSES[0];

  const filteredUsers = profiles.filter(p => {
    const name = `${p.display_name || ''} ${p.first_name || ''} ${p.last_name || ''} ${p.email || ''}`.toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const sub = getUserSub(p.user_id);
    const matchesTier = filterTier === 'all' || sub?.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || sub?.status === filterStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const stats = {
    total: profiles.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    suspended: subscriptions.filter(s => s.status === 'suspended').length,
    pro: subscriptions.filter(s => s.tier === 'pro' || s.tier === 'enterprise').length,
  };

  const openEditDialog = (userId: string) => {
    const sub = getUserSub(userId);
    const role = getUserRole(userId);
    setEditingUser(userId);
    setEditTier(sub?.tier || 'free');
    setEditStatus(sub?.status || 'active');
    setEditRole(role?.role || 'primary_user');
    setEditNotes(sub?.notes || '');
    setEditExpiresAt(sub?.expires_at ? sub.expires_at.split('T')[0] : '');
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase.rpc('admin_update_user_access', {
        p_target_user_id: editingUser,
        p_role: editRole as any,
        p_tier: editTier,
        p_status: editStatus,
        p_expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        p_notes: editNotes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Update failed');

      // Optimistic local update so table reflects changes immediately
      setSubscriptions(prev => {
        const idx = prev.findIndex(s => s.user_id === editingUser);
        const updated = {
          ...(prev[idx] ?? { id: '', started_at: now }),
          user_id: editingUser,
          tier: editTier,
          status: editStatus,
          notes: editNotes,
          expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        } as UserSubscription;
        if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
        return [...prev, updated];
      });

      setRoles(prev => {
        const idx = prev.findIndex(r => r.user_id === editingUser);
        const updated = { user_id: editingUser, role: editRole };
        if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
        return [...prev, updated];
      });

      toast({ title: 'User updated', description: 'Role and subscription saved.' });
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update user.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getUserDisplayName = (p: UserProfile) =>
    p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Unknown';

  const editingProfile = profiles.find(p => p.user_id === editingUser);

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-4">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-primary-foreground/80 text-xs sm:text-sm mt-0.5">
                Manage roles, subscriptions, and feature access
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="agreements" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agreements</span>
            </TabsTrigger>
            <TabsTrigger value="feature-flags" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <ToggleLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="admin-panel" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Database className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Overview ───────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Users', value: stats.total, color: '' },
                { label: 'Active', value: stats.active, color: 'text-green-600' },
                { label: 'Suspended', value: stats.suspended, color: 'text-red-600' },
                { label: 'Pro / Enterprise', value: stats.pro, color: 'text-purple-600' },
              ].map(s => (
                <Card key={s.label}>
                  <CardHeader className="pb-1 pt-4 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Users ──────────────────────────────────────────────────────── */}
          <TabsContent value="users" className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {SUBSCRIPTION_TIERS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {SUBSCRIPTION_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={fetchData}>
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Users Table - no fixed height, grows with content */}
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="py-2 text-xs">User</TableHead>
                    <TableHead className="py-2 text-xs">Role</TableHead>
                    <TableHead className="py-2 text-xs">Tier</TableHead>
                    <TableHead className="py-2 text-xs">Status</TableHead>
                    <TableHead className="py-2 text-xs hidden md:table-cell">Joined</TableHead>
                    <TableHead className="py-2 text-xs hidden lg:table-cell">Last Login</TableHead>
                    <TableHead className="py-2 text-xs text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((p) => {
                      const sub = getUserSub(p.user_id);
                      const role = getUserRole(p.user_id);
                      const tier = sub?.tier || 'free';
                      const statusInfo = getStatusInfo(sub?.status || 'active');

                      return (
                        <TableRow key={p.user_id} className="hover:bg-muted/30">
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={p.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getUserDisplayName(p).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate max-w-[160px]">{getUserDisplayName(p)}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">{p.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant={role?.role === 'system_admin' ? 'default' : 'outline'} className="text-xs whitespace-nowrap">
                              {role?.role === 'system_admin' && <Crown className="h-2.5 w-2.5 mr-1" />}
                              {role?.role === 'system_admin' ? 'Admin' : role?.role === 'secondary_user' ? 'Secondary' : 'Primary'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={`text-xs capitalize ${TIER_BADGE[tier] || ''}`}>
                              {tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                            {format(new Date(p.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                            {p.last_login_at ? format(new Date(p.last_login_at), 'MMM d, yyyy') : 'Never'}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditDialog(p.user_id)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Edit dialog */}
            <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingUser(null); }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit2 className="h-4 w-4" />
                    Override User Access
                  </DialogTitle>
                  <DialogDescription>
                    {editingProfile
                      ? <span><strong>{getUserDisplayName(editingProfile)}</strong> - {editingProfile.email}</span>
                      : 'Update role and subscription'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Role</Label>
                      <Select value={editRole} onValueChange={setEditRole}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system_admin">System Admin</SelectItem>
                          <SelectItem value="primary_user">Primary User</SelectItem>
                          <SelectItem value="secondary_user">Secondary User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Subscription Tier</Label>
                      <Select value={editTier} onValueChange={setEditTier}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SUBSCRIPTION_TIERS.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SUBSCRIPTION_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Expires At <span className="text-muted-foreground">(optional)</span></Label>
                      <Input
                        type="date"
                        value={editExpiresAt}
                        onChange={(e) => setEditExpiresAt(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Admin Notes</Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="e.g. manually upgraded for conference demo..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1 h-8 text-sm" onClick={() => { setEditDialogOpen(false); setEditingUser(null); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveUser} disabled={saving} className="flex-1 h-8 text-sm">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── Agreements ─────────────────────────────────────────────────── */}
          <TabsContent value="agreements" className="space-y-3">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">User Legal Agreements</CardTitle>
                <CardDescription className="text-xs">All recorded Terms of Service and Privacy Policy acceptances</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="py-2 text-xs">Email</TableHead>
                    <TableHead className="py-2 text-xs">Name</TableHead>
                    <TableHead className="py-2 text-xs">Agreement</TableHead>
                    <TableHead className="py-2 text-xs">Version</TableHead>
                    <TableHead className="py-2 text-xs">Agreed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : agreements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                        No agreements recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    agreements.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/30">
                        <TableCell className="py-2 text-xs font-medium">{a.email || a.user_id}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {a.display_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || '-'}
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {a.agreement_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">v{a.version}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(a.agreed_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ── Feature Flags ──────────────────────────────────────────────── */}
          <TabsContent value="feature-flags" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Feature Flag Control</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle Pro features ON to give free-tier users access (promotions, betas). Changes are saved to the database and take effect immediately for all users.
              </p>
            </div>
            <FeatureFlagsAdmin />
          </TabsContent>

          {/* ── Admin Panel ────────────────────────────────────────────────── */}
          <TabsContent value="admin-panel" className="space-y-4">
            <AdminSeedDataManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
