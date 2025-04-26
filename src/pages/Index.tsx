
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/MainLayout";
import { 
  Clock, 
  AlertTriangle, 
  Book, 
  MessageSquare, 
  Calendar,
  CheckCircle2,
  BarChart3, 
  ListTodo
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const DashboardWidget = ({ 
  title, 
  icon: Icon, 
  count, 
  description, 
  bgColor, 
  iconColor 
}: { 
  title: string; 
  icon: any; 
  count: string | number; 
  description: string; 
  bgColor: string;
  iconColor: string;
}) => (
  <Card className="glassmorphism">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold mb-1">{count}</div>
      <CardDescription>{description}</CardDescription>
    </CardContent>
  </Card>
);

const TaskItem = ({ title, course, dueDate, completed = false }: { title: string; course: string; dueDate: string; completed?: boolean }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-b-0">
    <div className="flex items-center gap-3">
      <div className={`p-1 rounded ${completed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
        {completed ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <div>
        <p className={`font-medium ${completed ? 'text-muted-foreground line-through' : ''}`}>{title}</p>
        <p className="text-sm text-muted-foreground">{course}</p>
      </div>
    </div>
    <div>
      <span className="text-xs font-medium px-2 py-1 rounded bg-muted">{dueDate}</span>
    </div>
  </div>
);

const SupplyItem = ({ name, count, threshold, total }: { name: string; count: number; threshold: number; total: number }) => (
  <div className="py-2 border-b last:border-b-0">
    <div className="flex justify-between mb-1">
      <span className="font-medium">{name}</span>
      <span className={count < threshold ? "text-red-500 font-bold" : ""}>{count}/{total}</span>
    </div>
    <Progress value={(count / total) * 100} className="h-2" />
  </div>
);

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-1">Welcome back, Professor!</h1>
        <p className="text-muted-foreground mb-8">Here's what's happening with your courses today.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardWidget 
            title="Tasks" 
            icon={ListTodo} 
            count="8" 
            description="Upcoming tasks" 
            bgColor="bg-primary/10" 
            iconColor="text-primary"
          />
          <DashboardWidget 
            title="Meetings" 
            icon={MessageSquare} 
            count="3" 
            description="Scheduled today" 
            bgColor="bg-accent/10" 
            iconColor="text-accent"
          />
          <DashboardWidget 
            title="Promises" 
            icon={Book} 
            count="12" 
            description="To follow up" 
            bgColor="bg-secondary/10" 
            iconColor="text-secondary"
          />
          <DashboardWidget 
            title="Supplies" 
            icon={AlertTriangle} 
            count="2" 
            description="Low stock alerts" 
            bgColor="bg-destructive/10" 
            iconColor="text-destructive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glassmorphism">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Upcoming Tasks</CardTitle>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <CardDescription>Tasks for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskItem 
                title="Grade CS101 Midterm Papers" 
                course="Computer Science 101" 
                dueDate="Today"
              />
              <TaskItem 
                title="Prepare Lab Materials for CS202" 
                course="Data Structures" 
                dueDate="Tomorrow"
              />
              <TaskItem 
                title="Faculty Meeting Notes" 
                course="Department" 
                dueDate="Today"
                completed
              />
              <TaskItem 
                title="Research Proposal Review" 
                course="Research Group" 
                dueDate="2 days"
              />
              <TaskItem 
                title="Submit Conference Abstract" 
                course="Research" 
                dueDate="3 days"
              />
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">+ Add New Task</Button>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-xl">Supply Alerts</CardTitle>
                <CardDescription>Items running low</CardDescription>
              </CardHeader>
              <CardContent>
                <SupplyItem name="Lab Notebooks" count={5} threshold={10} total={50} />
                <SupplyItem name="Whiteboard Markers" count={3} threshold={5} total={20} />
                <SupplyItem name="Printer Paper" count={12} threshold={10} total={50} />
                <SupplyItem name="Lab USB Drives" count={4} threshold={5} total={25} />
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View Inventory</Button>
              </CardFooter>
            </Card>

            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-xl">Upcoming Events</CardTitle>
                <CardDescription>Next 3 calendar items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Faculty Meeting</p>
                    <p className="text-sm text-muted-foreground">Today, 2:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Office Hours</p>
                    <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Student Project Reviews</p>
                    <p className="text-sm text-muted-foreground">Friday, 1:00 PM</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View Calendar</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
