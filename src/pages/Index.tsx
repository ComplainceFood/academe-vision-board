
import React from "react";
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

const Index = () => {
  const { user } = useAuth();

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

  // If user is not authenticated, show landing page
  if (!user) {
    return <LandingPreview />;
  }

  // Calculate stats
  const promiseCount = notes.filter((note: any) => note.type === 'commitment').length;
  const upcomingMeetings = meetings.filter((meeting: any) =>
    meeting.status === 'scheduled' && new Date(meeting.start_date) > new Date()
  ).length;
  const lowSuppliesCount = supplies.filter((supply: any) =>
    supply.current_count <= supply.threshold
  ).length;
  const shoppingItemsCount = shoppingItems.filter((item: any) => !item.purchased).length;
  const todoTasks = events.filter((event: any) =>
    event.type === 'task' && !event.completed
  ).length;
  const upcomingDeadlines = events.filter((event: any) =>
    event.type === 'deadline' && new Date(event.date) > new Date()
  ).length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayEvents = events.filter((event: any) =>
    new Date(event.date).toDateString() === new Date().toDateString()
  );

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
      <div className="animate-fade-in space-y-6">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-secondary/30 blur-2xl" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm text-primary-foreground/80">{today}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back!</h1>
              <p className="text-primary-foreground/75 text-sm mt-1">Here's your academic overview for today</p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" className="bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-sm">
                <Link to="/analytics"><BarChart className="h-4 w-4 mr-1.5" />Analytics</Link>
              </Button>
              <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-md">
                <Link to="/planning"><CalendarRange className="h-4 w-4 mr-1.5" />Planning</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(({ title, value, icon: Icon, to, desc, alert }) => (
            <Link key={title} to={to} className="group">
              <Card className={`border bg-card shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 ${alert ? 'border-red-200 dark:border-red-900/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-1.5 rounded-lg ${alert ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
                      <Icon className={`h-4 w-4 ${alert ? 'text-red-500' : 'text-primary'}`} />
                    </div>
                    {alert && (
                      <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">!</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{title}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Schedule + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BellRing className="h-4 w-4 text-primary" />
                  Today's Schedule
                </CardTitle>
                <Badge variant="outline" className="text-xs">{todayEvents.length} events</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todayEvents.length > 0 ? (
                <div className="space-y-2">
                  {todayEvents.slice(0, 5).map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          event.priority === 'high' ? 'bg-red-500' :
                          event.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.time || 'All day'} · {event.type}</p>
                        </div>
                      </div>
                      <Badge variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'default' : 'secondary'} className="text-xs ml-2 shrink-0">
                        {event.priority || 'normal'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                  <p className="font-medium text-sm">No events today</p>
                  <p className="text-xs text-muted-foreground mt-1">Your schedule is clear</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" asChild className="w-full h-9 text-sm">
                <Link to="/planning">View Full Schedule <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map(({ label, icon: Icon, to }) => (
                <Link key={label} to={to} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors bg-muted/40 hover:bg-muted/80">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/50" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Module Navigation */}
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            All Modules
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                <Card className="border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm cursor-pointer">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-xs font-medium leading-tight">{label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  linkTo: string;
  color: string;
  iconColor: string;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  compact?: boolean;
}

const DashboardCard = ({
  title,
  value,
  icon,
  linkTo,
  color,
  iconColor,
  description,
  badge,
  badgeVariant = "secondary",
  compact = false
}: DashboardCardProps) => {
  return (
    <Card className={compact ? "overflow-hidden" : ""}>
      <Link to={linkTo} className="block h-full">
        <CardContent className={`flex items-center gap-4 ${compact ? 'p-4' : 'pt-6'}`}>
          <div className={`rounded-full p-2 ${color}`}>
            <div className={`rounded-full p-1.5 ${iconColor}`}>
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-foreground">{value}</h3>
              {badge && (
                <Badge variant={badgeVariant}>{badge}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

// Landing Page Component for unauthenticated users
const LandingPage = () => {
  const features = [
    {
      icon: ListTodo,
      title: "Smart Task Management",
      description: "Break down complex tasks into subtasks with visual progress tracking. Smart deadline indicators show overdue, today, tomorrow, and this week at a glance.",
      image: notesPreview,
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
      highlights: ["Subtask Progress Bars", "Smart Deadline Alerts", "Priority Sorting"],
      badge: "Most Popular"
    },
    {
      icon: RefreshCw,
      title: "Recurring Tasks & Automation",
      description: "Set up daily, weekly, biweekly, or monthly recurring tasks that auto-regenerate upon completion. Never forget routine responsibilities again.",
      image: planningPreview,
      gradient: "from-teal-500 to-emerald-500",
      bgGradient: "from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30",
      highlights: ["Auto-Regeneration", "Pattern Scheduling", "End Date Control"],
      badge: "New"
    },
    {
      icon: FolderOpen,
      title: "Folder & Notebook System",
      description: "Create color-coded folders to organize notes, commitments, and research materials. Hierarchical structure keeps everything accessible.",
      image: notesPreview,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      highlights: ["Color Coding", "Hierarchical View", "Quick Navigation"],
      badge: "New"
    },
    {
      icon: Users,
      title: "Meeting & Collaboration Hub",
      description: "Schedule meetings, track action items, and manage attendees with calendar integration. Record meeting notes and follow-up tasks seamlessly.",
      image: meetingsPreview,
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
      highlights: ["Calendar Sync", "Action Items", "Recurring Meetings"],
      badge: null
    },
    {
      icon: Wallet,
      title: "Grant & Funding Tracker",
      description: "Track research grants, monitor expenditures, and generate detailed financial reports. Stay on top of budget allocations and spending.",
      image: fundingPreview,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
      highlights: ["Budget Tracking", "Expenditure Reports", "Multi-source Support"],
      badge: null
    },
    {
      icon: Package,
      title: "Inventory & Supply Management",
      description: "Monitor lab supplies with threshold alerts, manage shopping lists, and track inventory costs. Never run out of essential materials.",
      image: suppliesPreview,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30",
      highlights: ["Low Stock Alerts", "Shopping Lists", "Cost Analytics"],
      badge: null
    },
  ];

  const stats = [
    { icon: GraduationCap, value: "10K+", label: "Academics Empowered", gradient: "from-violet-500 to-purple-600" },
    { icon: TrendingUp, value: "40%", label: "Productivity Increase", gradient: "from-blue-500 to-cyan-500" },
    { icon: Shield, value: "100%", label: "Secure & Private", gradient: "from-emerald-500 to-teal-500" },
    { icon: Zap, value: "24/7", label: "Always Available", gradient: "from-amber-500 to-orange-500" },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Professor of Biology",
      institution: "Stanford University",
      content: "The smart deadline indicators and recurring task features have transformed how I manage my research commitments. I never miss a deadline now.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Prof. Michael Chen",
      role: "Computer Science Department",
      institution: "MIT",
      content: "The folder organization system is phenomenal. I can now easily categorize all my notes, publications, and student commitments in one place.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department",
      institution: "Harvard University",
      content: "Managing lab supplies with threshold alerts has eliminated emergency supply runs. The subtask feature helps me break down complex research tasks.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
      rating: 5
    }
  ];

  const keyFeatures = [
    { icon: CheckCircle2, title: "Subtasks & Progress", description: "Visual progress bars for complex tasks" },
    { icon: Clock, title: "Smart Deadlines", description: "Color-coded deadline indicators" },
    { icon: RefreshCw, title: "Recurring Tasks", description: "Auto-regenerating scheduled tasks" },
    { icon: FolderOpen, title: "Folder System", description: "Color-coded organizational folders" },
    { icon: Bell, title: "Smart Notifications", description: "Never miss important deadlines" },
    { icon: LineChart, title: "Analytics Dashboard", description: "Insights into your productivity" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              SmartProf
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-primary/5 font-medium">
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-primary/5 font-medium">
              <a href="#showcase">Showcase</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-primary/5 font-medium">
              <a href="#testimonials">Reviews</a>
            </Button>
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 text-white font-semibold">
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-background to-purple-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Now with Subtasks, Recurring Tasks & Folders
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Teaching Smarter.
              </span>
              <br />
              <span className="text-foreground">Managing Better.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one academic workspace designed for professors, researchers, and educators. 
              Organize tasks, track grants, manage supplies, and boost your productivity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 text-white h-12 sm:h-14 px-5 sm:px-8 text-base sm:text-lg font-semibold">
                <Link to="/auth">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-2 hover:bg-muted/50">
                <a href="#showcase">
                  <Play className="mr-2 h-5 w-5" />
                  See It In Action
                </a>
              </Button>
            </div>

            {/* Key Features Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {keyFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <feature.icon className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{stat.value}</h3>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Excel</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for academic professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br ${feature.bgGradient}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.gradient}`}></div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    {feature.badge && (
                      <Badge className={`text-xs font-semibold ${feature.badge === 'New' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'}`}>
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, hIndex) => (
                      <span 
                        key={hIndex}
                        className="text-xs font-medium bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-24 bg-gradient-to-br from-muted/50 via-background to-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Platform Showcase
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              See <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SmartProf</span> in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore the powerful features that make academic management effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Notes & Tasks Preview */}
            <div className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600"></div>
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                      <ListTodo className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Notes & Task Management</h3>
                      <p className="text-xs text-muted-foreground">Subtasks, deadlines, and organization</p>
                    </div>
                  </div>
                </div>
                <img 
                  src={notesPreview} 
                  alt="Notes and Task Management Dashboard" 
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Meetings Preview */}
            <div className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Meeting Scheduler</h3>
                      <p className="text-xs text-muted-foreground">Calendar sync and action items</p>
                    </div>
                  </div>
                </div>
                <img 
                  src={meetingsPreview} 
                  alt="Meeting Scheduling Dashboard" 
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Planning Preview */}
            <div className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Academic Planning</h3>
                      <p className="text-xs text-muted-foreground">Semester planning and roadmaps</p>
                    </div>
                  </div>
                </div>
                <img 
                  src={planningPreview} 
                  alt="Academic Planning Dashboard" 
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Analytics Preview */}
            <div className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                      <BarChart className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Analytics Dashboard</h3>
                      <p className="text-xs text-muted-foreground">Productivity insights and reports</p>
                    </div>
                  </div>
                </div>
                <img 
                  src={analyticsPreview} 
                  alt="Analytics Dashboard" 
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Supplies Preview */}
            <div className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Inventory Management</h3>
                      <p className="text-xs text-muted-foreground">Stock alerts and shopping lists</p>
                    </div>
                  </div>
                </div>
                <img 
                  src={suppliesPreview} 
                  alt="Inventory Management Dashboard" 
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Funding Preview */}
            <div className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Grant & Funding Tracker</h3>
                      <p className="text-xs text-muted-foreground">Budget tracking and expenditures</p>
                    </div>
                  </div>
                </div>
                <img 
                  src={fundingPreview} 
                  alt="Grant Funding Management Dashboard" 
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Trusted by <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Academics</span> Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what professors and researchers are saying about SmartProf
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8">
                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs text-primary">{testimonial.institution}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Start Your Journey
            </Badge>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Academic Workflow?
            </h2>
            
            <p className="text-xl text-white/80 mb-10">
              Join thousands of academics who are already using SmartProf to boost their productivity and organize their professional lives.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-violet-700 hover:bg-white/90 shadow-xl h-14 px-8 text-lg font-semibold">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg font-semibold bg-transparent">
                <a href="#features">
                  Learn More
                  <ChevronRight className="ml-1 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-2 rounded-xl">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                SmartProf
              </span>
            </div>
            
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} SmartProf. Empowering academics worldwide.
            </p>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
