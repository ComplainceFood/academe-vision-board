
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
      icon: BookOpen,
      title: "Academic Achievement Tracking",
      description: "Track publications, presentations, awards, and professional development in one comprehensive system.",
      gradient: "from-primary via-primary/80 to-primary/60",
      delay: "0ms",
      image: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
    {
      icon: Calendar,
      title: "Smart Planning & Scheduling",
      description: "Integrate with Google Calendar and Outlook. Plan semesters, schedule meetings, and never miss important deadlines.",
      gradient: "from-secondary via-secondary/80 to-secondary/60",
      delay: "100ms",
      image: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
    {
      icon: DollarSign,
      title: "Funding & Financial Management",
      description: "Monitor research grants, track expenditures, and manage funding sources with detailed reporting capabilities.",
      gradient: "from-accent via-accent/80 to-accent/60",
      delay: "200ms",
      image: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
    {
      icon: Target,
      title: "Task & Commitment Management",
      description: "Organize notes, commitments, and tasks with intelligent tagging and priority systems.",
      gradient: "from-primary via-secondary to-accent",
      delay: "300ms",
      image: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
    {
      icon: Users,
      title: "Meeting & Collaboration Tools",
      description: "Schedule meetings, track attendance, manage action items, and collaborate effectively with colleagues.",
      gradient: "from-secondary via-accent to-primary",
      delay: "400ms",
      image: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
    {
      icon: Lightbulb,
      title: "Supplies & Resource Tracking",
      description: "Monitor lab supplies, track inventory levels, manage shopping lists, and control expenses efficiently.",
      gradient: "from-accent via-primary to-secondary",
      delay: "500ms",
      image: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
  ];

  const stats = [
    { icon: Award, value: "95%", label: "User Satisfaction", gradient: "from-primary to-primary/80" },
    { icon: TrendingUp, value: "40%", label: "Productivity Increase", gradient: "from-secondary to-secondary/80" },
    { icon: Shield, value: "100%", label: "Data Security", gradient: "from-accent to-accent/80" },
    { icon: Zap, value: "24/7", label: "Uptime Reliability", gradient: "from-primary to-secondary" },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Professor of Biology",
      institution: "Stanford University",
      content: "SmartProf revolutionized how I manage my research grants and student commitments. The calendar integration alone saved me hours every week.",
      avatar: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
    {
      name: "Prof. Michael Chen",
      role: "Computer Science Department",
      institution: "MIT",
      content: "The achievement tracking feature is phenomenal. I can now easily compile my annual reports and track publication metrics in real-time.",
      avatar: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department",
      institution: "Harvard University",
      content: "Managing lab supplies and funding has never been easier. The analytics help me make data-driven decisions about resource allocation.",
      avatar: "/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-lg blur-sm opacity-75"></div>
              <BookOpen className="relative h-8 w-8 text-primary-foreground bg-gradient-to-r from-primary to-primary/80 p-1.5 rounded-lg shadow-lg" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              SmartProf
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <a href="#testimonials">Reviews</a>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32 text-center">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="mb-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-full text-sm font-medium text-primary animate-scale-in shadow-lg backdrop-blur-sm">
              <Zap className="h-4 w-4 mr-2" />
              The Future of Academic Management
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Elevate Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Academic Excellence
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              The comprehensive platform that empowers professors and academics to manage achievements, funding, research, and daily tasks with unprecedented efficiency and intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-12 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 animate-scale-in">
                <Link to="/auth">Start Your Journey</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-12 py-6 border-primary/30 hover:border-primary/50 hover:bg-primary/5 hover-scale group">
                <a href="#features" className="flex items-center">
                  Explore Features
                  <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </Button>
            </div>

            {/* Hero Image/Screenshot Placeholder */}
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-2xl"></div>
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-2 shadow-2xl">
                <img 
                  src="/lovable-uploads/fb745a42-3221-43ad-a62f-665ee055b654.png" 
                  alt="SmartProf Dashboard Preview" 
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-muted/30 via-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Trusted by Leading Academics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professors and researchers who have transformed their productivity
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="text-center animate-fade-in hover-scale group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r ${stat.gradient} mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110`}>
                  <stat.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Everything You Need,
              </span>
              <br />
              <span className="text-foreground">All in One Place</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Streamline your academic workflow with our comprehensive suite of tools designed specifically for modern educators and researchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-700 hover:shadow-2xl animate-fade-in hover-scale"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-700`} />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Feature Image */}
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-700`} />
                  <div className={`absolute top-4 left-4 w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300 leading-tight">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10 pt-0">
                  <CardDescription className="text-base leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-muted/30 via-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              What Academics Are Saying
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how SmartProf is transforming academic productivity worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name}
                className="group relative overflow-hidden bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <p className="text-lg leading-relaxed text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300">
                      "{testimonial.content}"
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-sm opacity-75"></div>
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="relative w-12 h-12 rounded-full object-cover shadow-lg"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                      <div className="text-xs text-muted-foreground/80">
                        {testimonial.institution}
                      </div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        <div className="absolute top-10 left-10 w-24 h-24 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-accent/30 to-primary/30 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }}></div>
        
        <div className="relative container mx-auto px-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-sm border-primary/20 shadow-2xl animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            
            <CardContent className="relative z-10 p-12 md:p-16 text-center">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    Ready to Transform
                  </span>
                  <br />
                  <span className="text-foreground">Your Academic Workflow?</span>
                </h3>
                
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of professors and researchers who have already elevated their productivity and streamlined their academic management with SmartProf.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg px-12 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover-scale">
                    <Link to="/auth">Get Started Today</Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Free forever • No credit card required • 2-minute setup
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-lg blur-sm"></div>
                <BookOpen className="relative h-8 w-8 text-primary-foreground bg-gradient-to-r from-primary to-primary/80 p-1.5 rounded-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                SmartProf
              </span>
            </div>
            <p className="text-muted-foreground text-lg mb-4">
              Empowering academic excellence through intelligent management
            </p>
            <p className="text-sm text-muted-foreground/80">
              © 2024 SmartProf. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
