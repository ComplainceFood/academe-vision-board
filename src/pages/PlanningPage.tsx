
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  MoreVertical,
  Plus,
  CheckCircle,
  FileText,
  AlertCircle,
  CalendarDays,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  date: string;
  type: "deadline" | "event" | "task" | "meeting";
  course: string;
  time?: string;
  description?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
}

// Mock events data for the current semester
const mockEvents: Event[] = [
  {
    id: "1",
    title: "CS101 Midterm",
    date: "2025-04-28",
    type: "deadline",
    course: "CS101",
    time: "10:00 AM",
    description: "First midterm examination covering chapters 1-5"
  },
  {
    id: "2",
    title: "Project Proposals Due",
    date: "2025-04-29",
    type: "deadline",
    course: "CS404",
    time: "11:59 PM",
    description: "Final deadline for submitting senior project proposals"
  },
  {
    id: "3",
    title: "Faculty Meeting",
    date: "2025-04-30",
    type: "meeting",
    course: "Department",
    time: "2:00 PM",
    description: "Monthly department faculty meeting"
  },
  {
    id: "4",
    title: "Lab Reports Grading",
    date: "2025-05-02",
    type: "task",
    course: "CS202",
    description: "Grade all lab reports from last week's lab session",
    completed: false,
    priority: "high"
  },
  {
    id: "5",
    title: "Research Symposium",
    date: "2025-05-05",
    type: "event",
    course: "Research",
    time: "9:00 AM",
    description: "Annual department research symposium, student presentations"
  },
  {
    id: "6",
    title: "Office Hours",
    date: "2025-05-01",
    type: "meeting",
    course: "All",
    time: "1:00 PM - 3:00 PM",
    description: "Weekly office hours"
  },
  {
    id: "7",
    title: "Update Course Website",
    date: "2025-04-27",
    type: "task",
    course: "CS101",
    description: "Update course website with new lecture materials and schedule",
    completed: true,
    priority: "medium"
  },
  {
    id: "8",
    title: "Prepare Lab Materials",
    date: "2025-04-29",
    type: "task",
    course: "CS202",
    description: "Prepare lab materials for next week's session on data structures",
    completed: false,
    priority: "medium"
  },
  {
    id: "9",
    title: "CS202 Final Exam",
    date: "2025-05-15",
    type: "deadline",
    course: "CS202",
    time: "1:00 PM",
    description: "Comprehensive final examination"
  },
  {
    id: "10",
    title: "Academic Conference",
    date: "2025-05-10",
    type: "event",
    course: "Research",
    time: "All Day",
    description: "International conference on computer science education"
  },
];

// Future semester mock tasks
const futureTasks = [
  {
    id: "f1",
    title: "Update curriculum for CS101",
    semester: "Fall 2025",
    priority: "high",
    estimatedHours: 15,
    description: "Revise the introductory programming course curriculum to include more modern examples and practices."
  },
  {
    id: "f2",
    title: "Develop new data science elective",
    semester: "Spring 2026",
    priority: "medium",
    estimatedHours: 40,
    description: "Create a new undergraduate elective course focused on data science fundamentals and applications."
  },
  {
    id: "f3",
    title: "Lab equipment upgrade proposal",
    semester: "Fall 2025",
    priority: "high",
    estimatedHours: 10,
    description: "Draft proposal for department to upgrade computer lab equipment."
  },
  {
    id: "f4",
    title: "Sabbatical research planning",
    semester: "Spring 2026",
    priority: "low",
    estimatedHours: 25,
    description: "Plan research activities and collaborations for upcoming sabbatical."
  },
  {
    id: "f5",
    title: "Textbook selection for CS202",
    semester: "Fall 2025",
    priority: "medium",
    estimatedHours: 8,
    description: "Review and select updated textbook for Data Structures course."
  }
];

const EventCard = ({ event }: { event: Event }) => {
  const eventTypeStyles = {
    deadline: "bg-destructive/15 text-destructive border-destructive/20",
    event: "bg-secondary/15 text-secondary border-secondary/20",
    task: "bg-accent/15 text-accent border-accent/20",
    meeting: "bg-primary/15 text-primary border-primary/20"
  };
  
  const eventTypeIcons = {
    deadline: <AlertCircle className="h-4 w-4" />,
    event: <CalendarDays className="h-4 w-4" />,
    task: <FileText className="h-4 w-4" />,
    meeting: <Clock className="h-4 w-4" />
  };
  
  return (
    <Card className={`mb-3 border-l-4 ${event.type === 'deadline' ? 'border-l-destructive' : event.type === 'event' ? 'border-l-secondary' : event.type === 'task' ? 'border-l-accent' : 'border-l-primary'} glassmorphism`}>
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div>
          <div className="flex flex-wrap gap-2 items-center mb-1">
            <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${eventTypeStyles[event.type]}`}>
              {eventTypeIcons[event.type]}
              <span className="capitalize">{event.type}</span>
            </span>
            
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {event.course}
            </span>
            
            {event.type === 'task' && (
              <span className={`text-xs px-2 py-1 rounded ${event.completed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {event.completed ? 'Completed' : 'Pending'}
              </span>
            )}
            
            {event.priority && (
              <Badge variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'outline' : 'secondary'}>
                {event.priority} priority
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-base font-medium">{event.title}</CardTitle>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            {event.type === 'task' && !event.completed && (
              <DropdownMenuItem>Mark as Complete</DropdownMenuItem>
            )}
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {event.description && (
          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
        )}
        
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>{new Date(event.date).toLocaleDateString()}</span>
          {event.time && (
            <>
              <span className="mx-1">•</span>
              <Clock className="h-3 w-3 mr-1" />
              <span>{event.time}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PlanningCalendar = ({ events }: { events: Event[] }) => {
  // Get current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');
  
  // Calendar navigation
  const prevMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - 1);
    setCurrentDate(date);
  };
  
  const nextMonth = () => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    setCurrentDate(date);
  };
  
  const today = () => {
    setCurrentDate(new Date());
  };
  
  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Create array of days
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border/30 p-1"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.date === dateString);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div key={day} className={cn(
          "h-24 border border-border/30 p-1 overflow-hidden relative",
          isToday ? "bg-primary/5 border-primary/30" : ""
        )}>
          <div className={cn(
            "absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-xs",
            isToday ? "bg-primary text-primary-foreground" : "text-foreground"
          )}>
            {day}
          </div>
          <div className="mt-5 space-y-1">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div key={idx} 
                className={cn(
                  "text-xs truncate px-1 py-0.5 rounded",
                  event.type === 'deadline' ? 'bg-destructive/15 text-destructive' : 
                  event.type === 'event' ? 'bg-secondary/15 text-secondary' : 
                  event.type === 'task' ? 'bg-accent/15 text-accent' : 
                  'bg-primary/15 text-primary'
                )}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">
          {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 mb-2">
        {weekdays.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-0 mb-6">
        {renderCalendar()}
      </div>
      
      <div>
        <h3 className="font-medium text-lg mb-3">Upcoming Events</h3>
        <div className="space-y-2">
          {sortedEvents.slice(0, 5).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
};

const FutureTaskCard = ({ task }: { task: any }) => {
  const priorityColors = {
    high: "bg-destructive/15 text-destructive",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-green-100 text-green-700"
  };
  
  return (
    <Card className="mb-3 glassmorphism">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div>
          <div className="flex flex-wrap gap-2 items-center mb-1">
            <span className="text-xs bg-muted px-2 py-1 rounded">{task.semester}</span>
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>
              {task.priority} priority
            </span>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
              ~{task.estimatedHours} hours
            </span>
          </div>
          <CardTitle className="text-base font-medium">{task.title}</CardTitle>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">{task.description}</p>
      </CardContent>
    </Card>
  );
};

const PlanningPage = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Semester & Planning</h1>
            <p className="text-muted-foreground">Plan your schedule and upcoming semesters</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Event</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="calendar" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="future" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Future Planning</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-4">
            <Card className="glassmorphism">
              <CardContent className="p-6">
                <PlanningCalendar events={mockEvents} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="future" className="mt-4">
            <Card className="glassmorphism">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Future Semester Planning</CardTitle>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Task</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="fall2025">
                  <TabsList className="mb-4">
                    <TabsTrigger value="fall2025">Fall 2025</TabsTrigger>
                    <TabsTrigger value="spring2026">Spring 2026</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fall2025">
                    <div className="space-y-3">
                      {futureTasks.filter(task => task.semester === "Fall 2025").map(task => (
                        <FutureTaskCard key={task.id} task={task} />
                      ))}
                      
                      {futureTasks.filter(task => task.semester === "Fall 2025").length === 0 && (
                        <div className="text-center py-12">
                          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium mb-1">No tasks planned</h3>
                          <p className="text-muted-foreground">Add tasks for Fall 2025 semester</p>
                          <Button className="mt-4">Add Task</Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="spring2026">
                    <div className="space-y-3">
                      {futureTasks.filter(task => task.semester === "Spring 2026").map(task => (
                        <FutureTaskCard key={task.id} task={task} />
                      ))}
                      
                      {futureTasks.filter(task => task.semester === "Spring 2026").length === 0 && (
                        <div className="text-center py-12">
                          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium mb-1">No tasks planned</h3>
                          <p className="text-muted-foreground">Add tasks for Spring 2026 semester</p>
                          <Button className="mt-4">Add Task</Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card className="mt-6 glassmorphism">
              <CardHeader>
                <CardTitle>Course Development Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute h-full w-0.5 bg-border left-3 top-0"></div>
                  
                  <div className="mb-6 relative pl-12">
                    <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">1</span>
                    </span>
                    <h3 className="text-lg font-medium mb-1">Curriculum Review</h3>
                    <p className="text-muted-foreground text-sm">Review and update all course materials and curriculum to reflect latest industry practices and research.</p>
                  </div>
                  
                  <div className="mb-6 relative pl-12">
                    <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">2</span>
                    </span>
                    <h3 className="text-lg font-medium mb-1">New Course Development</h3>
                    <p className="text-muted-foreground text-sm">Create new data science and machine learning electives for upper-level undergraduates.</p>
                  </div>
                  
                  <div className="mb-6 relative pl-12">
                    <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">3</span>
                    </span>
                    <h3 className="text-lg font-medium mb-1">Lab Redesign</h3>
                    <p className="text-muted-foreground text-sm">Modernize lab environments and update equipment to support new curriculum.</p>
                  </div>
                  
                  <div className="relative pl-12">
                    <span className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">4</span>
                    </span>
                    <h3 className="text-lg font-medium mb-1">Teaching Methods Improvement</h3>
                    <p className="text-muted-foreground text-sm">Research and implement innovative teaching methods to improve student engagement and learning outcomes.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PlanningPage;
