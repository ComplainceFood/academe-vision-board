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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Users, ShieldAlert, Search, Crown, UserCheck, UserX,
  Edit, BarChart3, Filter, RefreshCw, FileCheck, Database, ToggleLeft
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
  { value: 'free', label: 'Free', color: 'text-muted-foreground' },
  { value: 'basic', label: 'Basic', color: 'text-blue-600' },
  { value: 'pro', label: 'Pro', color: 'text-purple-600' },
  { value: 'enterprise', label: 'Enterprise', color: 'text-amber-600' },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'expired', label: 'Expired', color: 'bg-muted text-muted-foreground' },
  { value: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
];

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
  const getTierInfo = (tier: string) => SUBSCRIPTION_TIERS.find(t => t.value === tier) || SUBSCRIPTION_TIERS[0];
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
      const existingSub = getUserSub(editingUser);

      // Upsert subscription — include started_at so NOT NULL constraint is satisfied on insert
      const subPayload: Record<string, any> = {
        user_id: editingUser,
        tier: editTier,
        status: editStatus,
        notes: editNotes,
        updated_at: now,
        started_at: existingSub?.started_at ?? now,
        expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      };

      // Try update first; if no rows affected, insert
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', editingUser)
        .maybeSingle();

      let subError;
      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update(subPayload)
          .eq('user_id', editingUser);
        subError = error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert(subPayload);
        subError = error;
      }

      if (subError) throw subError;

      // Update role:
      // The unique constraint is on (user_id, role) — not just user_id — so a user
      // can have multiple rows. Strategy: insert the desired role first (ignore if
      // already exists), then delete all OTHER role rows for this user. This way
      // the user is never left role-less even if the delete step fails.
      const { error: roleInsertError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: editingUser, role: editRole as any },
          { onConflict: 'user_id,role', ignoreDuplicates: true }
        );

      if (roleInsertError) throw roleInsertError;

      // Remove any other role rows for this user (roles that differ from editRole)
      const { error: roleDeleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser)
        .neq('role', editRole);

      if (roleDeleteError) throw roleDeleteError;

      // Optimistically update local state so table reflects changes immediately
      setSubscriptions(prev => {
        const idx = prev.findIndex(s => s.user_id === editingUser);
        const updated = {
          ...(prev[idx] ?? { id: '', started_at: now }),
          user_id: editingUser,
          tier: editTier,
          status: editStatus,
          notes: editNotes,
          expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
          updated_at: now,
        } as UserSubscription;
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });

      setRoles(prev => {
        const idx = prev.findIndex(r => r.user_id === editingUser);
        const updated = { user_id: editingUser, role: editRole };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });

      toast({ title: 'User updated', description: 'Subscription and role saved successfully.' });
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast({ title: 'Error', description: err.message || 'Failed to update user.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getUserDisplayName = (p: UserProfile) => {
    return p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Unknown';
  };

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
                <Users className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">User Management</h1>
                <p className="text-primary-foreground/80 text-sm sm:text-lg mt-1">
                  View registered users, manage roles, and control subscription access
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 max-w-3xl">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="agreements" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Agreements</span>
            </TabsTrigger>
            <TabsTrigger value="feature-flags" className="flex items-center gap-2">
              <ToggleLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="admin-panel" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Panel</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{stats.active}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Suspended</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{stats.suspended}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pro / Enterprise</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-purple-600">{stats.pro}</div></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {SUBSCRIPTION_TIERS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {SUBSCRIPTION_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Users Table */}
            <Card>
              <ScrollArea className="h-[400px] sm:h-[500px] md:h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((p) => {
                        const sub = getUserSub(p.user_id);
                        const role = getUserRole(p.user_id);
                        const tierInfo = getTierInfo(sub?.tier || 'free');
                        const statusInfo = getStatusInfo(sub?.status || 'active');

                        return (
                          <TableRow key={p.user_id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={p.avatar_url || ''} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getUserDisplayName(p).charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{getUserDisplayName(p)}</p>
                                  <p className="text-xs text-muted-foreground">{p.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={role?.role === 'system_admin' ? 'default' : 'outline'} className="text-xs">
                                {role?.role === 'system_admin' && <Crown className="h-3 w-3 mr-1" />}
                                {role?.role || 'primary_user'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`text-sm font-medium ${tierInfo.color}`}>
                                {tierInfo.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(p.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {p.last_login_at ? format(new Date(p.last_login_at), 'MMM d, yyyy') : 'Never'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(p.user_id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>

            {/* Single shared edit dialog — rendered outside the map to avoid stale state */}
            <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingUser(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage User Access</DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? `Editing: ${getUserDisplayName(profiles.find(p => p.user_id === editingUser)!)}`
                      : 'Update role and subscription'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system_admin">System Admin</SelectItem>
                        <SelectItem value="primary_user">Primary User</SelectItem>
                        <SelectItem value="secondary_user">Secondary User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subscription Tier</Label>
                    <Select value={editTier} onValueChange={setEditTier}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUBSCRIPTION_TIERS.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subscription Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUBSCRIPTION_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expires At <span className="text-xs text-muted-foreground">(leave blank = no expiry)</span></Label>
                    <Input
                      type="date"
                      value={editExpiresAt}
                      onChange={(e) => setEditExpiresAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Notes</Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="e.g. manually upgraded for conference demo..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1" onClick={() => { setEditDialogOpen(false); setEditingUser(null); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveUser} disabled={saving} className="flex-1">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="agreements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Legal Agreements</CardTitle>
                <CardDescription>All recorded Terms of Service and Privacy Policy acceptances</CardDescription>
              </CardHeader>
              <ScrollArea className="h-[400px] sm:h-[500px] md:h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Agreement Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Agreed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : agreements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No agreements recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      agreements.map((a: UserAgreementWithEmail) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm font-medium">{a.email || a.user_id}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {a.display_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {a.agreement_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">v{a.version}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(a.agreed_at), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>
          <TabsContent value="feature-flags" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Feature Flag Control</h2>
              <p className="text-sm text-muted-foreground">
                Toggle Pro features on or off for all users. When a feature is toggled ON, every user (including free tier) can access it — use this to run promotions or during beta periods. Toggle OFF to enforce subscription-based access.
              </p>
            </div>
            <FeatureFlagsAdmin />
          </TabsContent>
          <TabsContent value="admin-panel" className="space-y-6">
            <AdminSeedDataManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
