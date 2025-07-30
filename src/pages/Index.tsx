
import React from "react";
import { MainLayout } from "@/components/MainLayout";
import { SeedDataButton } from "@/components/SeedDataButton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDataFetching } from "@/hooks/useDataFetching";
import { AnalyticsInsights } from "@/components/analytics/AnalyticsInsights";

// Create a client
const queryClient = new QueryClient();

const Index = () => {
  const { user } = useAuth();
  
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
  const promiseCount = notes.filter((note: any) => note.type === 'promise').length;
  const upcomingMeetings = meetings.filter((meeting: any) => 
    meeting.status === 'scheduled' && new Date(meeting.date) > new Date()
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
          <h1 className="text-3xl font-bold mb-2">Welcome to Academia Vision</h1>
          <p className="text-muted-foreground mb-8">Your teaching assistant dashboard for managing courses, students, and resources</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard 
              title="Student Promises" 
              value={promiseCount} 
              icon={<CheckSquare className="h-5 w-5 text-blue-500" />}
              linkTo="/notes"
              color="bg-blue-50 dark:bg-blue-900/20"
              iconColor="text-blue-500 dark:text-blue-400"
              description="Promises to students"
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
              title="Low Supplies" 
              value={lowSuppliesCount} 
              icon={<ShoppingBag className="h-5 w-5 text-amber-500" />}
              linkTo="/supplies"
              color="bg-amber-50 dark:bg-amber-900/20"
              iconColor="text-amber-500 dark:text-amber-400"
              description="Items below threshold"
              badge={lowSuppliesCount > 0 ? "Action Needed" : undefined}
              badgeVariant={lowSuppliesCount > 0 ? "destructive" : undefined}
            />
            <DashboardCard 
              title="Shopping List" 
              value={shoppingItemsCount} 
              icon={<ShoppingBag className="h-5 w-5 text-green-500" />}
              linkTo="/supplies"
              color="bg-green-50 dark:bg-green-900/20"
              iconColor="text-green-500 dark:text-green-400"
              description="Items to purchase"
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
                    <BookOpen className="mr-2 h-4 w-4" /> Record New Promise
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/meetings">
                    <Users className="mr-2 h-4 w-4" /> Schedule Meeting
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/supplies">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Update Inventory
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/planning">
                    <CalendarRange className="mr-2 h-4 w-4" /> Add Event
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/funding">
                    <DollarSign className="mr-2 h-4 w-4" /> Manage Funding
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

export default Index;
