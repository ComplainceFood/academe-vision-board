import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
  RadialBarChart, RadialBar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, FileText, Users, ShoppingBag,
  DollarSign, Clock, Target, BarChart3, RefreshCw, Award, BookOpen,
  CheckCircle2, AlertTriangle, Zap, Brain, ArrowUpRight, ArrowDownRight,
  FlaskConical, GraduationCap, Layers
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AnalyticsInsights } from "./AnalyticsInsights";
import { ProGate } from "@/components/common/ProGate";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OverviewMetric {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

interface AnalyticsData {
  overview: {
    totalNotes: number;
    totalMeetings: number;
    totalSupplies: number;
    totalExpenses: number;
    totalFunding: number;
    activeGrants: number;
    totalAchievements: number;
    taskCompletionRate: number;
    completedTasks: number;
    totalTasks: number;
    upcomingDeadlines: UpcomingDeadline[];
    lowSupplies: number;
  };
  trends: TrendPoint[];
  categories: CategoryPoint[];
  productivity: ProductivityPoint[];
  achievements: AchievementCategory[];
  fundingByStatus: FundingStatus[];
}

interface TrendPoint { date: string; notes: number; meetings: number; expenses: number; }
interface CategoryPoint { name: string; value: number; color: string; }
interface ProductivityPoint { week: string; completed: number; pending: number; }
interface AchievementCategory { name: string; count: number; fill: string; }
interface FundingStatus { name: string; value: number; color: string; }
interface UpcomingDeadline { title: string; date: string; daysLeft: number; type: string; }

// ── Chart Colours ─────────────────────────────────────────────────────────────
const CHART_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ACHIEVEMENT_COLORS: Record<string, string> = {
  publication: '#7c3aed',
  presentation: '#06b6d4',
  award_honor: '#f59e0b',
  course_taught: '#10b981',
  grant_received: '#3b82f6',
  student_supervision: '#8b5cf6',
  service_review: '#ec4899',
  teaching_performance: '#14b8a6',
  leadership_role: '#f97316',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-1">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon: Icon, gradient, iconBg }: OverviewMetric) => (
  <Card className={`relative overflow-hidden border-0 shadow-md ${gradient}`}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-white/70 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ── Skeleton loader ───────────────────────────────────────────────────────────
const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
    <Skeleton className="h-72 rounded-2xl" />
    <div className="grid md:grid-cols-2 gap-4">
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { toast } = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user) fetchAll(); }, [user, timeRange]);

  // ── Data Fetching ────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(timeRange));

      const [
        notesRes, meetingsRes, suppliesRes, expensesRes,
        fundingRes, achievementsRes, tasksRes
      ] = await Promise.allSettled([
        supabase.from('notes').select('*').eq('user_id', user!.id),
        supabase.from('meetings').select('*').eq('user_id', user!.id),
        supabase.from('supplies').select('current_count, threshold').eq('user_id', user!.id),
        supabase.from('expenses').select('amount, date').eq('user_id', user!.id),
        supabase.from('funding_sources').select('total_amount, remaining_amount, status, name').eq('user_id', user!.id),
        supabase.from('scholastic_achievements').select('category').eq('user_id', user!.id),
        supabase.from('planning_events').select('*').eq('user_id', user!.id),
      ]);

      const notes = (notesRes.status === 'fulfilled' ? notesRes.value.data : null) || [];
      const meetings = (meetingsRes.status === 'fulfilled' ? meetingsRes.value.data : null) || [];
      const supplies = (suppliesRes.status === 'fulfilled' ? suppliesRes.value.data : null) || [];
      const expenses = (expensesRes.status === 'fulfilled' ? expensesRes.value.data : null) || [];
      const funding = (fundingRes.status === 'fulfilled' ? fundingRes.value.data : null) || [];
      const achievements = (achievementsRes.status === 'fulfilled' ? achievementsRes.value.data : null) || [];
      const tasks = (tasksRes.status === 'fulfilled' ? tasksRes.value.data : null) || [];

      // Completion rate
      const taskItems = tasks.filter((t: any) => t.type === 'task');
      const completedTasks = taskItems.filter((t: any) => t.completed).length;
      const taskCompletionRate = taskItems.length > 0 ? Math.round((completedTasks / taskItems.length) * 100) : 0;

      // Upcoming deadlines (next 14 days)
      const now = new Date();
      const in14 = new Date(); in14.setDate(now.getDate() + 14);
      const upcomingDeadlines: UpcomingDeadline[] = tasks
        .filter((t: any) => t.type === 'deadline' && !t.completed && new Date(t.date) >= now && new Date(t.date) <= in14)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
        .map((t: any) => ({
          title: t.title,
          date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          daysLeft: Math.ceil((new Date(t.date).getTime() - now.getTime()) / 86400000),
          type: t.category || 'General',
        }));

      // Achievement categories
      const achCounts: Record<string, number> = {};
      achievements.forEach((a: any) => { achCounts[a.category] = (achCounts[a.category] || 0) + 1; });
      const achievementData: AchievementCategory[] = Object.entries(achCounts).map(([cat, count]) => ({
        name: cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        count,
        fill: ACHIEVEMENT_COLORS[cat] || '#7c3aed',
      }));

      // Funding by status
      const fundingByStatus: FundingStatus[] = [
        { name: 'Active', value: funding.filter((f: any) => f.status === 'active').length, color: '#10b981' },
        { name: 'Completed', value: funding.filter((f: any) => f.status === 'completed').length, color: '#7c3aed' },
        { name: 'Pending', value: funding.filter((f: any) => f.status === 'pending').length, color: '#f59e0b' },
      ].filter(f => f.value > 0);

      // Categories for pie
      const categories: CategoryPoint[] = [
        { name: 'Notes', value: notes.length, color: CHART_COLORS[0] },
        { name: 'Meetings', value: meetings.length, color: CHART_COLORS[1] },
        { name: 'Supplies', value: supplies.length, color: CHART_COLORS[2] },
        { name: 'Tasks', value: taskItems.length, color: CHART_COLORS[3] },
        { name: 'Achievements', value: achievements.length, color: CHART_COLORS[4] },
      ].filter(c => c.value > 0);

      setData({
        overview: {
          totalNotes: notes.length,
          totalMeetings: meetings.length,
          totalSupplies: supplies.length,
          totalExpenses: expenses.reduce((s: number, e: any) => s + Number(e.amount), 0),
          totalFunding: funding.reduce((s: number, f: any) => s + Number(f.total_amount), 0),
          activeGrants: funding.filter((f: any) => f.status === 'active').length,
          totalAchievements: achievements.length,
          taskCompletionRate,
          completedTasks,
          totalTasks: taskItems.length,
          upcomingDeadlines,
          lowSupplies: supplies.filter((s: any) => s.current_count <= s.threshold).length,
        },
        trends: buildTrends(start, end, notes, meetings, expenses),
        categories,
        productivity: buildProductivity(tasks),
        achievements: achievementData,
        fundingByStatus,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load analytics data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const buildTrends = (start: Date, end: Date, notes: any[], meetings: any[], expenses: any[]): TrendPoint[] => {
    const days = Math.min(Math.ceil((end.getTime() - start.getTime()) / 86400000), 30);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        notes: notes.filter((n: any) => (n.due_date || n.created_at || '').startsWith(ds)).length,
        meetings: meetings.filter((m: any) => (m.start_date || '').startsWith(ds)).length,
        expenses: expenses.filter((e: any) => (e.date || '').startsWith(ds)).length,
      };
    });
  };

  const buildProductivity = (tasks: any[]): ProductivityPoint[] => {
    const taskItems = tasks.filter((t: any) => t.type === 'task');
    return Array.from({ length: 4 }, (_, i) => {
      const idx = 3 - i;
      const wEnd = new Date(); wEnd.setDate(wEnd.getDate() - idx * 7);
      const wStart = new Date(wEnd); wStart.setDate(wEnd.getDate() - 6);
      const week = taskItems.filter((t: any) => {
        const td = new Date(t.date);
        return td >= wStart && td <= wEnd;
      });
      return {
        week: `Wk ${i + 1}`,
        completed: week.filter((t: any) => t.completed).length,
        pending: week.filter((t: any) => !t.completed).length,
      };
    });
  };

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground mb-4">Failed to load analytics data.</p>
      <Button onClick={fetchAll} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
    </div>
  );

  // ── Metric Cards Config ──────────────────────────────────────────────────────
  const metrics: OverviewMetric[] = [
    {
      label: 'Notes & Tasks', value: data.overview.totalNotes,
      sub: `${data.overview.totalTasks} tracked tasks`,
      icon: FileText, gradient: 'bg-gradient-to-br from-violet-600 to-purple-700', iconBg: 'bg-white/20',
    },
    {
      label: 'Task Completion', value: `${data.overview.taskCompletionRate}%`,
      sub: `${data.overview.completedTasks} / ${data.overview.totalTasks} done`,
      icon: CheckCircle2, gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', iconBg: 'bg-white/20',
    },
    {
      label: 'Meetings', value: data.overview.totalMeetings,
      sub: 'Total scheduled',
      icon: Users, gradient: 'bg-gradient-to-br from-sky-500 to-blue-600', iconBg: 'bg-white/20',
    },
    {
      label: 'Upcoming Deadlines', value: data.overview.upcomingDeadlines.length,
      sub: 'In next 14 days',
      icon: Clock,
      gradient: data.overview.upcomingDeadlines.length > 3
        ? 'bg-gradient-to-br from-red-500 to-rose-600'
        : 'bg-gradient-to-br from-amber-500 to-orange-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Total Expenses', value: formatCurrency(data.overview.totalExpenses),
      sub: 'Across all categories',
      icon: DollarSign, gradient: 'bg-gradient-to-br from-pink-500 to-rose-600', iconBg: 'bg-white/20',
    },
    {
      label: 'Total Funding', value: formatCurrency(data.overview.totalFunding),
      sub: `${data.overview.activeGrants} active grant${data.overview.activeGrants !== 1 ? 's' : ''}`,
      icon: TrendingUp, gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600', iconBg: 'bg-white/20',
    },
    {
      label: 'Achievements', value: data.overview.totalAchievements,
      sub: 'Publications, awards & more',
      icon: Award, gradient: 'bg-gradient-to-br from-amber-400 to-yellow-600', iconBg: 'bg-white/20',
    },
    {
      label: 'Supply Health', value: data.overview.lowSupplies === 0 ? 'Good' : `${data.overview.lowSupplies} Low`,
      sub: `${data.overview.totalSupplies} total items`,
      icon: ShoppingBag,
      gradient: data.overview.lowSupplies > 0
        ? 'bg-gradient-to-br from-red-500 to-orange-600'
        : 'bg-gradient-to-br from-teal-500 to-cyan-600',
      iconBg: 'bg-white/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Your Academic Overview
          </h2>
          <p className="text-sm text-muted-foreground">Real-time insights from all your modules</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAll} className="h-9 w-9 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm py-2">Trends</TabsTrigger>
          <TabsTrigger value="productivity" className="text-xs sm:text-sm py-2">Productivity</TabsTrigger>
          <TabsTrigger value="research" className="text-xs sm:text-sm py-2">Research</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm py-2 flex items-center gap-1">
            <Brain className="h-3.5 w-3.5" />AI
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Activity Summary Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Activity Distribution</CardTitle>
                <CardDescription>Breakdown across all modules</CardDescription>
              </CardHeader>
              <CardContent>
                {data.categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={data.categories} cx="45%" cy="50%" innerRadius={55} outerRadius={90}
                        paddingAngle={3} dataKey="value">
                        {data.categories.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                    No activity data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription>Next 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                {data.overview.upcomingDeadlines.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.overview.upcomingDeadlines.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground">{d.date}</p>
                        </div>
                        <Badge variant={d.daysLeft <= 2 ? 'destructive' : d.daysLeft <= 5 ? 'default' : 'secondary'}
                          className="ml-2 shrink-0 text-xs">
                          {d.daysLeft === 0 ? 'Today' : d.daysLeft === 1 ? 'Tomorrow' : `${d.daysLeft}d`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                    <p className="text-sm font-medium">All clear!</p>
                    <p className="text-xs text-muted-foreground">No deadlines in the next 14 days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Task Completion Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Task Completion Rate</CardTitle>
              <CardDescription>
                {data.overview.completedTasks} completed out of {data.overview.totalTasks} total tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold text-lg">{data.overview.taskCompletionRate}%</span>
              </div>
              <Progress value={data.overview.taskCompletionRate} className="h-3" />
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                  <p className="text-lg font-bold text-emerald-600">{data.overview.completedTasks}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-500/10">
                  <p className="text-lg font-bold text-amber-600">{data.overview.totalTasks - data.overview.completedTasks}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-primary/10">
                  <p className="text-lg font-bold text-primary">{data.overview.upcomingDeadlines.length}</p>
                  <p className="text-xs text-muted-foreground">Deadlines Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TRENDS TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity Trends</CardTitle>
              <CardDescription>Notes, meetings and expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="notes" name="Notes" stroke="#7c3aed" strokeWidth={2} fill="url(#gNotes)" />
                  <Area type="monotone" dataKey="meetings" name="Meetings" stroke="#06b6d4" strokeWidth={2} fill="url(#gMeetings)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#10b981" strokeWidth={2} fill="url(#gExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly bar breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly Activity Breakdown</CardTitle>
              <CardDescription>Last 7 days daily summary</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.trends.slice(-7)} barSize={14} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="notes" name="Notes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meetings" name="Meetings" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRODUCTIVITY TAB ─────────────────────────────────────────────── */}
        <TabsContent value="productivity" className="space-y-4">
          {/* Radial completion + weekly bars */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Completion Rate</CardTitle>
                <CardDescription>Overall task completion this period</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                    startAngle={90} endAngle={90 - 360 * (data.overview.taskCompletionRate / 100)}
                    data={[{ value: data.overview.taskCompletionRate, fill: '#7c3aed' }]}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="-mt-16 text-center">
                  <p className="text-4xl font-bold text-primary">{data.overview.taskCompletionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                  <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xl font-bold text-emerald-600">{data.overview.completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xl font-bold text-amber-600">{data.overview.totalTasks - data.overview.completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Weekly Tasks</CardTitle>
                <CardDescription>Completed vs pending by week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.productivity} barSize={18} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Supply health */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                Supply & Resource Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{data.overview.totalSupplies}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Items</p>
                </div>
                <div className={`p-4 rounded-xl text-center ${data.overview.lowSupplies > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                  <p className={`text-2xl font-bold ${data.overview.lowSupplies > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {data.overview.lowSupplies}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Below Threshold</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {data.overview.totalSupplies > 0
                      ? Math.round(((data.overview.totalSupplies - data.overview.lowSupplies) / data.overview.totalSupplies) * 100)
                      : 100}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Stocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESEARCH TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="research" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Achievements by category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Achievements by Category
                </CardTitle>
                <CardDescription>Total: {data.overview.totalAchievements}</CardDescription>
              </CardHeader>
              <CardContent>
                {data.achievements.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.achievements} layout="vertical" barSize={14} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                        {data.achievements.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[240px] text-center">
                    <GraduationCap className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No achievements recorded yet</p>
                    <p className="text-xs text-muted-foreground">Add publications, awards, and more in the Achievements module</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Funding portfolio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-500" />
                  Funding Portfolio
                </CardTitle>
                <CardDescription>{formatCurrency(data.overview.totalFunding)} total across {data.overview.activeGrants} active grants</CardDescription>
              </CardHeader>
              <CardContent>
                {data.fundingByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={data.fundingByStatus} cx="45%" cy="50%" innerRadius={50} outerRadius={85}
                        paddingAngle={4} dataKey="value">
                        {data.fundingByStatus.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <DollarSign className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No funding sources yet</p>
                    <p className="text-xs text-muted-foreground">Add grants in the Grant Management module</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Research summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Publications', icon: BookOpen, value: data.achievements.find(a => a.name.toLowerCase().includes('publication'))?.count || 0, color: 'text-violet-600', bg: 'bg-violet-500/10' },
              { label: 'Presentations', icon: Layers, value: data.achievements.find(a => a.name.toLowerCase().includes('presentation'))?.count || 0, color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
              { label: 'Awards', icon: Award, value: data.achievements.find(a => a.name.toLowerCase().includes('award'))?.count || 0, color: 'text-amber-600', bg: 'bg-amber-500/10' },
              { label: 'Active Grants', icon: FlaskConical, value: data.overview.activeGrants, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            ].map(({ label, icon: Icon, value, color, bg }) => (
              <Card key={label} className={`border-0 ${bg}`}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Icon className={`h-6 w-6 ${color} mb-2`} />
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── AI INSIGHTS TAB ──────────────────────────────────────────────── */}
        <TabsContent value="insights">
          <ProGate featureKey="analytics_ai_insights" featureLabel="AI Analytics Insights">
            <AnalyticsInsights />
          </ProGate>
        </TabsContent>
      </Tabs>
    </div>
  );
};
