
import React from "react";
import { MainLayout } from "@/components/MainLayout";
import { SeedDataButton } from "@/components/SeedDataButton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDataFetching } from "@/hooks/useDataFetching";
import { AnalyticsInsights } from "@/components/analytics/AnalyticsInsights";

// Create a client
const queryClient = new QueryClient();

const Index = () => {
  const { user } = useAuth();

  // If user is not authenticated, show landing page
  if (!user) {
    return <LandingPage />;
  }
  
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

  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Welcome to Smart-Prof</h1>
          <p className="text-muted-foreground mb-8">Teaching Smarter. Managing Better - Your comprehensive academic platform</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard 
              title="Student Commitments" 
              value={promiseCount} 
              icon={<CheckSquare className="h-5 w-5 text-blue-500" />}
              linkTo="/notes"
              color="bg-blue-50 dark:bg-blue-900/20"
              iconColor="text-blue-500 dark:text-blue-400"
              description="Academic commitments to students"
            />
            <DashboardCard 
              title="Upcoming Meetings" 
              value={upcomingMeetings} 
              icon={<Users className="h-5 w-5 text-violet-500" />}
              linkTo="/meetings"
              color="bg-violet-50 dark:bg-violet-900/20"
              iconColor="text-violet-500 dark:text-violet-400"
              description="Scheduled meetings"
            />
            <DashboardCard 
              title="Low Resources" 
              value={lowSuppliesCount} 
              icon={<ShoppingBag className="h-5 w-5 text-amber-500" />}
              linkTo="/supplies"
              color="bg-amber-50 dark:bg-amber-900/20"
              iconColor="text-amber-500 dark:text-amber-400"
              description="Resources below threshold"
              badge={lowSuppliesCount > 0 ? "Action Needed" : undefined}
              badgeVariant={lowSuppliesCount > 0 ? "destructive" : undefined}
            />
            <DashboardCard 
              title="Resource Requests" 
              value={shoppingItemsCount} 
              icon={<ShoppingBag className="h-5 w-5 text-green-500" />}
              linkTo="/supplies"
              color="bg-green-50 dark:bg-green-900/20"
              iconColor="text-green-500 dark:text-green-400"
              description="Resources to acquire"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-purple-500" />
                  <span>Upcoming Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DashboardCard 
                    title="Tasks" 
                    value={todoTasks} 
                    icon={<CheckSquare className="h-5 w-5 text-indigo-500" />}
                    linkTo="/planning"
                    color="bg-indigo-50 dark:bg-indigo-900/20"
                    iconColor="text-indigo-500 dark:text-indigo-400"
                    description="Outstanding tasks"
                    compact
                  />
                  <DashboardCard 
                    title="Deadlines" 
                    value={upcomingDeadlines} 
                    icon={<Clock className="h-5 w-5 text-red-500" />}
                    linkTo="/planning"
                    color="bg-red-50 dark:bg-red-900/20"
                    iconColor="text-red-500 dark:text-red-400"
                    description="Upcoming deadlines"
                    compact
                  />
                </div>
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    <span>Today's Schedule</span>
                  </h3>
                  <div className="space-y-2">
                    {events.filter((event: any) => 
                      new Date(event.date).toDateString() === new Date().toDateString()
                    ).slice(0, 3).map((event: any) => (
                      <div key={event.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.time || 'All day'} • {event.type}</p>
                        </div>
                        <Badge variant={
                          event.priority === 'high' 
                            ? 'destructive' 
                            : event.priority === 'medium' 
                              ? 'outline' 
                              : 'secondary'
                        }>{event.priority || 'medium'}</Badge>
                      </div>
                    ))}
                    {events.filter((event: any) => 
                      new Date(event.date).toDateString() === new Date().toDateString()
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">No events scheduled for today</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/planning">View Full Schedule</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/notes">
                    <BookOpen className="mr-2 h-4 w-4" /> Record New Commitment
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/meetings">
                    <Users className="mr-2 h-4 w-4" /> Schedule Meeting
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/supplies">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Update Resources
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/planning">
                    <CalendarRange className="mr-2 h-4 w-4" /> Add Event
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/funding">
                    <DollarSign className="mr-2 h-4 w-4" /> Manage Grants
                  </Link>
                </Button>
                <SeedDataButton />
              </CardContent>
            </Card>
          </div>
          
          {/* AI Insights Section */}
          <div className="mb-8">
            <AnalyticsInsights />
          </div>
        </div>
      </MainLayout>
    </QueryClientProvider>
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
            <p className="text-sm font-medium">{title}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
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
      icon: Target,
      title: "Smart Task Management",
      description: "Organize tasks with subtasks, progress tracking, and smart deadline indicators that keep you focused on what matters most.",
      gradient: "from-violet-500 to-purple-600",
      highlights: ["Subtask Progress", "Smart Deadlines", "Priority Sorting"],
      delay: "0ms"
    },
    {
      icon: Calendar,
      title: "Recurring Tasks & Automation",
      description: "Set up daily, weekly, or monthly recurring tasks that automatically regenerate, ensuring nothing falls through the cracks.",
      gradient: "from-blue-500 to-cyan-500",
      highlights: ["Auto-regeneration", "Pattern Scheduling", "End Date Control"],
      delay: "100ms"
    },
    {
      icon: BookOpen,
      title: "Folder Organization",
      description: "Create color-coded folders and notebooks to organize your notes, commitments, and research materials hierarchically.",
      gradient: "from-emerald-500 to-teal-500",
      highlights: ["Color Coding", "Hierarchical View", "Quick Navigation"],
      delay: "200ms"
    },
    {
      icon: DollarSign,
      title: "Funding & Grant Management",
      description: "Track research grants, monitor expenditures, and generate reports with detailed financial oversight capabilities.",
      gradient: "from-amber-500 to-orange-500",
      highlights: ["Budget Tracking", "Expenditure Reports", "Multi-source"],
      delay: "300ms"
    },
    {
      icon: Users,
      title: "Meeting & Collaboration",
      description: "Schedule meetings, track action items, and manage attendees with seamless calendar integration.",
      gradient: "from-rose-500 to-pink-500",
      highlights: ["Calendar Sync", "Action Items", "Recurring Meetings"],
      delay: "400ms"
    },
    {
      icon: Lightbulb,
      title: "Supplies & Inventory",
      description: "Monitor lab supplies, track inventory levels with threshold alerts, and manage shopping lists efficiently.",
      gradient: "from-indigo-500 to-violet-500",
      highlights: ["Low Stock Alerts", "Shopping Lists", "Cost Tracking"],
      delay: "500ms"
    },
  ];

  const stats = [
    { icon: Award, value: "95%", label: "User Satisfaction", gradient: "from-violet-500 to-purple-600" },
    { icon: TrendingUp, value: "40%", label: "Productivity Boost", gradient: "from-blue-500 to-cyan-500" },
    { icon: Shield, value: "100%", label: "Data Security", gradient: "from-emerald-500 to-teal-500" },
    { icon: Zap, value: "24/7", label: "Always Available", gradient: "from-amber-500 to-orange-500" },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Professor of Biology",
      institution: "Stanford University",
      content: "The smart deadline indicators and recurring task features have transformed how I manage my research commitments. I never miss a deadline now.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Prof. Michael Chen",
      role: "Computer Science Department",
      institution: "MIT",
      content: "The folder organization system is phenomenal. I can now easily categorize all my notes, publications, and student commitments in one place.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department",
      institution: "Harvard University",
      content: "Managing lab supplies with threshold alerts has eliminated emergency supply runs. The subtask feature helps me break down complex research tasks.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const newFeatures = [
    { icon: CheckSquare, title: "Subtasks & Progress", description: "Break down tasks into manageable subtasks with visual progress tracking" },
    { icon: Clock, title: "Smart Deadlines", description: "Visual indicators for overdue, today, tomorrow, and this week" },
    { icon: BarChart, title: "Recurring Tasks", description: "Daily, weekly, biweekly, monthly patterns with auto-regeneration" },
    { icon: BookOpen, title: "Folder System", description: "Organize with color-coded folders and hierarchical structure" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 p-2 rounded-xl shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              SmartProf
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-primary/5">
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-primary/5">
              <a href="#new-features">What's New</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-primary/5">
              <a href="#testimonials">Reviews</a>
            </Button>
            <Button asChild className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 text-white">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-background to-purple-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
          <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="mb-6 inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-full text-sm font-medium text-violet-600 dark:text-violet-400 shadow-lg backdrop-blur-sm">
              <Zap className="h-4 w-4 mr-2" />
              Now with Smart Tasks, Subtasks & Folder Organization
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                Academic Excellence,
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Effortlessly Managed
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              The all-in-one platform for professors and researchers. Manage tasks with subtasks and smart deadlines, organize with folders, track grants, and never miss a commitment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
                <Link to="/auth">Start Free Today</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/5 group">
                <a href="#features" className="flex items-center">
                  Explore Features
                  <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </Button>
            </div>

            {/* New Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {newFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full shadow-sm hover:shadow-md hover:border-violet-500/30 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
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
      <section className="py-16 bg-gradient-to-r from-muted/20 via-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-xl hover:border-violet-500/20 transition-all duration-500 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${stat.gradient} mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's New Section */}
      <section id="new-features" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-background to-background"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-full text-sm font-medium text-violet-600 dark:text-violet-400 mb-4">
              <Zap className="h-4 w-4 mr-2" />
              New Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Latest Enhancements
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've added powerful new features to supercharge your productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newFeatures.map((feature, index) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-violet-500/30 hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="relative z-10 p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive suite of tools designed specifically for modern academics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-violet-500/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <CardHeader className="relative z-10 pb-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10 pt-0">
                  <CardDescription className="text-base text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 mb-4">
                    {feature.description}
                  </CardDescription>
                  
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${feature.gradient} bg-opacity-10 text-foreground/80 border border-current/10`}
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </CardContent>
                
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-muted/20 via-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Loved by Academics Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how SmartProf is transforming academic productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name}
                className="group relative overflow-hidden bg-card/70 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-2xl hover:border-violet-500/20 transition-all duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-6 relative z-10">
                  <div className="mb-5">
                    <div className="text-lg leading-relaxed text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300">
                      "{testimonial.content}"
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="relative w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white/50"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                      <div className="text-xs text-violet-600/70 dark:text-violet-400/70">
                        {testimonial.institution}
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-background to-purple-500/5"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <div className="relative container mx-auto px-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-card/90 via-card/70 to-card/90 backdrop-blur-sm border-violet-500/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
            
            <CardContent className="relative z-10 p-10 md:p-14 text-center">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Ready to Get Started?
                  </span>
                </h3>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of academics who have streamlined their workflow with SmartProf's powerful features.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-10 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
                    <Link to="/auth">Start Free Today</Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Free forever • No credit card required
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 p-2 rounded-xl">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                SmartProf
              </span>
            </div>
            <p className="text-muted-foreground mb-2">
              Empowering academic excellence through intelligent management
            </p>
            <p className="text-sm text-muted-foreground/70">
              © 2024 SmartProf. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
