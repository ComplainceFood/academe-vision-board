
import React, { useMemo } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  CalendarRange, 
  Clock, 
  ShoppingBag, 
  Users, 
  BarChart, 
  CheckSquare,
  BellRing,
  DollarSign,
  Calendar,
  Lightbulb,
  Target,
  Award,
  TrendingUp,
  Shield,
  Zap,
  Layers,
  RefreshCw,
  FolderOpen,
  PieChart,
  Wallet,
  Package,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Star,
  ChevronRight,
  CheckCircle2,
  Play,
  LayoutDashboard,
  ListTodo,
  Bell,
  LineChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDataFetching } from "@/hooks/useDataFetching";
import { AnalyticsInsights } from "@/components/analytics/AnalyticsInsights";
import LandingPreview from "@/pages/LandingPreview";
import { useProfile } from "@/hooks/useProfile";
import { resetOnboarding } from "@/components/common/OnboardingModal";

const Index = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  // All hooks must be called unconditionally (React Rules of Hooks)
  const { data: notes } = useDataFetching<any>({
    table: 'notes',
    enabled: !!user
  });

  const { data: meetings } = useDataFetching<any>({
    table: 'meetings',
    enabled: !!user
  });

  const { data: supplies } = useDataFetching<any>({
    table: 'supplies',
    enabled: !!user
  });

  const { data: events } = useDataFetching<any>({
    table: 'planning_events',
    enabled: !!user
  });

  const { data: shoppingItems } = useDataFetching<any>({
    table: 'shopping_list',
    enabled: !!user
  });

  // Calculate stats - memoized so they don't recompute on unrelated re-renders
  // Must run before the !user early return (React Rules of Hooks)
  const { promiseCount, upcomingMeetings, lowSuppliesCount, shoppingItemsCount, todoTasks, upcomingDeadlines } = useMemo(() => {
    const now = new Date();
    return {
      promiseCount: (notes ?? []).filter((note: any) => note.type === 'commitment').length,
      upcomingMeetings: (meetings ?? []).filter((meeting: any) =>
        meeting.status === 'scheduled' && new Date(meeting.start_date) > now
      ).length,
      lowSuppliesCount: (supplies ?? []).filter((supply: any) =>
        supply.current_count <= supply.threshold
      ).length,
      shoppingItemsCount: (shoppingItems ?? []).filter((item: any) => !item.purchased).length,
      todoTasks: (events ?? []).filter((event: any) => event.type === 'task' && !event.completed).length,
      upcomingDeadlines: (events ?? []).filter((event: any) =>
        event.type === 'deadline' && new Date(event.date) > now
      ).length,
    };
  }, [notes, meetings, supplies, shoppingItems, events]);

  // If user is not authenticated, show landing page
  if (!user) {
    return <LandingPreview />;
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Parse a date string (YYYY-MM-DD or ISO) as local date to avoid UTC-offset shifting
  const parseLocalDate = (dateStr: string): Date => {
    // If it's just a date (YYYY-MM-DD), parse as local to avoid UTC midnight -> prev day in local tz
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    if (dateOnly) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
  };

  const nowDate = new Date();
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  // End of week = start of Sunday 7 days from today
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(startOfToday.getDate() + 7);

  const weekEvents = events
    .filter((event: any) => {
      if (!event.date) return false;
      const d = parseLocalDate(event.date);
      return d >= startOfToday && d < endOfWeek;
    })
    .sort((a: any, b: any) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

  const statCards = [
    { title: 'Commitments', value: promiseCount, icon: CheckSquare, to: '/notes', desc: 'Student commitments' },
    { title: 'Meetings', value: upcomingMeetings, icon: Users, to: '/meetings', desc: 'Upcoming scheduled' },
    { title: 'Pending Tasks', value: todoTasks, icon: Clock, to: '/planning', desc: 'Outstanding tasks' },
    { title: 'Deadlines', value: upcomingDeadlines, icon: Target, to: '/planning', desc: 'Upcoming deadlines' },
    { title: 'Low Resources', value: lowSuppliesCount, icon: ShoppingBag, to: '/supplies', desc: 'Below threshold', alert: lowSuppliesCount > 0 },
    { title: 'Shopping List', value: shoppingItemsCount, icon: Package, to: '/supplies', desc: 'Items to acquire' },
  ];

  const quickLinks = [
    { label: 'Record Commitment', icon: BookOpen, to: '/notes' },
    { label: 'Schedule Meeting', icon: Users, to: '/meetings' },
    { label: 'Add Planning Event', icon: CalendarRange, to: '/planning' },
    { label: 'Manage Grants', icon: DollarSign, to: '/funding' },
    { label: 'Update Resources', icon: ShoppingBag, to: '/supplies' },
    { label: 'View Analytics', icon: BarChart, to: '/analytics' },
  ];

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-4">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-secondary p-3 sm:p-4 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-secondary/30 blur-2xl" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="h-3 w-3 text-yellow-300 shrink-0" />
                <span className="text-xs text-primary-foreground/80 truncate">{today}</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight leading-tight">Welcome back!</h1>
              <p className="text-primary-foreground/75 text-xs mt-0.5">Your academic overview for today</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button asChild size="sm" className="bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-sm text-xs h-7 sm:h-8">
                <Link to="/analytics"><BarChart className="h-3.5 w-3.5 mr-1" />Analytics</Link>
              </Button>
              <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-md text-xs h-7 sm:h-8">
                <Link to="/planning"><CalendarRange className="h-3.5 w-3.5 mr-1" />Planning</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Profile completion nudge - shown until position + department are filled */}
        {profile && (!profile.position || !profile.department) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="text-xl shrink-0">👋</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-tight">
                  Complete your profile to personalise Smart‑Prof
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Adding your <strong>Position</strong> and <strong>Department</strong> unlocks role-tailored guidance across the platform.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 h-7 px-2"
                onClick={() => { resetOnboarding(); window.location.reload(); }}
              >
                Replay tour
              </Button>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white h-7 text-xs">
                <Link to="/settings">Go to Settings →</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {statCards.map(({ title, value, icon: Icon, to, desc, alert }) => (
            <Link key={title} to={to} className="group">
              <Card className={`border bg-card shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 ${alert ? 'border-red-200 dark:border-red-900/30' : ''}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className={`p-1 sm:p-1.5 rounded-lg ${alert ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
                      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${alert ? 'text-red-500' : 'text-primary'}`} />
                    </div>
                    {alert && (
                      <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1 py-0.5 rounded-full font-medium">!</span>
                    )}
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground leading-none">{value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight line-clamp-2">{title}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Three-column panel: Events 33% | Quick Actions 20% | All Modules ~47% */}
        <div className="grid grid-cols-1 md:grid-cols-[33%_20%_1fr] gap-3">

          {/* Col 1 - This Week's Events (33%) */}
          <Card className="flex flex-col">
            <CardHeader className="pb-1.5 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                  <BellRing className="h-4 w-4 text-primary" />
                  This Week's Events
                </CardTitle>
                <Badge variant="outline" className="text-xs px-2 py-0">{weekEvents.length} upcoming</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-2 pt-0">
              {weekEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {weekEvents.slice(0, 7).map((event: any) => {
                    const eventDate = parseLocalDate(event.date);
                    const isToday = eventDate.toDateString() === nowDate.toDateString();
                    const isTomorrow = eventDate.toDateString() === new Date(startOfToday.getTime() + 86400000).toDateString();
                    const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeLabel = event.start_time || event.time || null;
                    return (
                      <div key={event.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            event.priority === 'high' ? 'bg-red-500' :
                            event.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate leading-tight">{event.title}</p>
                            <p className="text-xs text-muted-foreground leading-tight">
                              <span className={isToday ? 'text-primary font-medium' : ''}>{dayLabel}</span>
                              {timeLabel && <span> · {timeLabel}</span>}
                              <span className="capitalize"> · {event.type}</span>
                            </p>
                          </div>
                        </div>
                        <Badge variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px] px-1.5 ml-2 shrink-0">
                          {event.priority || 'low'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-2" />
                  <p className="font-medium text-sm">No events this week</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Schedule is clear</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="px-4 pt-1 pb-3">
              <Button variant="outline" asChild className="w-full h-8 text-xs">
                <Link to="/planning">View Full Schedule <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Col 2 - Quick Actions (20%) */}
          <Card className="flex flex-col">
            <CardHeader className="pb-1.5 pt-3 px-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-3 pb-3 pt-0 space-y-1.5">
              {quickLinks.map(({ label, icon: Icon, to }) => (
                <Link key={label} to={to} className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md transition-colors bg-muted/40 hover:bg-muted/80">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-xs font-medium leading-tight">{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/50 shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Col 3 - All Modules (remaining ~47%) */}
          <Card className="flex flex-col">
            <CardHeader className="pb-1.5 pt-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                All Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-3 pt-0">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Notes & Commitments', icon: BookOpen, to: '/notes' },
                  { label: 'Meetings', icon: Users, to: '/meetings' },
                  { label: 'Semester Planning', icon: CalendarRange, to: '/planning' },
                  { label: 'Grant Management', icon: DollarSign, to: '/funding' },
                  { label: 'Supplies & Expenses', icon: ShoppingBag, to: '/supplies' },
                  { label: 'Achievements', icon: Award, to: '/achievements' },
                  { label: 'Analytics', icon: BarChart, to: '/analytics' },
                  { label: 'Communications', icon: BellRing, to: '/communications' },
                ].map(({ label, icon: Icon, to }) => (
                  <Link key={label} to={to}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-muted/40 hover:bg-muted/80 transition-colors cursor-pointer">
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-medium leading-tight">{label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </MainLayout>
  );
};

export default Index;

