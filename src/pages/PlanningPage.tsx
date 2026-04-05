import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ListTodo,
  Clock,
  Target,
  TrendingUp,
  Sparkles,
  GraduationCap,
  BookOpen,
  Layers,
  ArrowRight,
  Wand2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { EventDialog } from "@/components/planning/EventDialog";
import { FutureTaskDialog } from "@/components/planning/FutureTaskDialog";
import { OutlookIntegrationConsolidated } from "@/components/planning/OutlookIntegrationConsolidated";
import { GoogleCalendarIntegration } from "@/components/planning/GoogleCalendarIntegration";
import { PlanningCalendar } from "@/components/planning/PlanningCalendar";
import { FutureTaskCard } from "@/components/planning/FutureTaskCard";
import { 
  usePlanningEvents, 
  useFuturePlanning,
  usePlanningEventActions,
  useFutureTaskActions,
  PlanningEvent,
  FutureTask,
  EventFormData,
  FutureTaskFormData
} from "@/services/planningService";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";

// Dynamically generate semesters based on current date
const getSemesters = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const allSemesters = [];
  // Generate semesters from 2 years ago to 2 years ahead
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    allSemesters.push({ value: `Spring ${y}`, label: `Spring ${y}`, endMonth: 5, year: y }); // Spring ends June
    allSemesters.push({ value: `Fall ${y}`, label: `Fall ${y}`, endMonth: 11, year: y }); // Fall ends Dec
  }

  const isPast = (sem: { endMonth: number; year: number }) => {
    if (sem.year < currentYear) return true;
    if (sem.year === currentYear && currentMonth > sem.endMonth) return true;
    return false;
  };

  const icons = [Sparkles, GraduationCap, BookOpen, Layers];
  const pastSemesters = allSemesters.filter(s => isPast(s));
  const currentAndFuture = allSemesters.filter(s => !isPast(s)).slice(0, 4);

  return {
    current: currentAndFuture.map((s, i) => ({ ...s, icon: icons[i % icons.length] })),
    past: pastSemesters.slice(-4).reverse().map((s, i) => ({ ...s, icon: icons[i % icons.length] })),
  };
};

const { current: CURRENT_SEMESTERS, past: PAST_SEMESTERS } = getSemesters();

const PlanningPage = () => {
  const { toast } = useToast();
  
  const eventsQuery = usePlanningEvents();
  const { data: eventsData = [], isLoading: eventsLoading } = eventsQuery;
  const { data: futureTasksData = [], isLoading: tasksLoading } = useFuturePlanning();
  
  const events = eventsData as PlanningEvent[];
  const futureTasks = futureTasksData as FutureTask[];
  
  const { createPlanningEvent, updatePlanningEvent, toggleEventCompletion, deletePlanningEvent } = usePlanningEventActions();
  const { createFutureTask, updateFutureTask, deleteFutureTask } = useFutureTaskActions();

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PlanningEvent | undefined>(undefined);
  const [currentTask, setCurrentTask] = useState<FutureTask | undefined>(undefined);
  const [activeFutureTab, setActiveFutureTab] = useState(CURRENT_SEMESTERS[0]?.value || "Spring 2026");
  const [showPastSemesters, setShowPastSemesters] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);
    
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(`${e.date}T00:00:00`);
      return isAfter(eventDate, today) || format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    });
    
    const thisWeekEvents = upcomingEvents.filter(e => {
      const eventDate = new Date(`${e.date}T00:00:00`);
      return isBefore(eventDate, nextWeek);
    });
    
    const completedTasks = events.filter(e => e.type === 'task' && e.completed).length;
    const totalTasks = events.filter(e => e.type === 'task').length;
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const deadlines = events.filter(e => e.type === 'deadline' && !e.completed);
    const urgentDeadlines = deadlines.filter(e => {
      const eventDate = new Date(`${e.date}T00:00:00`);
      return isBefore(eventDate, nextWeek);
    });

    const totalFutureTasks = futureTasks.length;
    const highPriorityTasks = futureTasks.filter(t => t.priority === 'high').length;
    const totalEstimatedHours = futureTasks.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

    return {
      totalEvents: upcomingEvents.length,
      thisWeekEvents: thisWeekEvents.length,
      taskProgress,
      completedTasks,
      totalTasks,
      urgentDeadlines: urgentDeadlines.length,
      totalFutureTasks,
      highPriorityTasks,
      totalEstimatedHours
    };
  }, [events, futureTasks]);

  const handleOpenEventDialog = (event?: PlanningEvent) => {
    setCurrentEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleOpenTaskDialog = (task?: FutureTask) => {
    setCurrentTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleEventSave = async (eventData: EventFormData) => {
    try {
      if (currentEvent?.id) {
        await updatePlanningEvent({ id: currentEvent.id, updates: eventData });
        toast({ title: "Event updated", description: "Your changes have been saved" });
      } else {
        await createPlanningEvent(eventData);
        toast({ title: "Event created", description: "Added to your calendar" });
      }
      eventsQuery.refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save event", variant: "destructive" });
    }
  };

  const handleTaskSave = async (taskData: FutureTaskFormData) => {
    if (currentTask?.id) {
      await updateFutureTask({ id: currentTask.id, updates: taskData });
      toast({ title: "Task updated" });
    } else {
      await createFutureTask({...taskData, semester: activeFutureTab});
      toast({ title: "Task added" });
    }
  };

  const filteredTasks = futureTasks.filter(task => task.semester === activeFutureTab);

  const handleToggleCompletion = async (id: string, completed: boolean) => {
    await toggleEventCompletion({ id, completed });
  };

  const handleDeleteEvent = async (id: string) => {
    await deletePlanningEvent(id);
    toast({ title: "Event deleted" });
  };

  const handleDeleteTask = async (id: string) => {
    await deleteFutureTask(id);
    toast({ title: "Task deleted" });
  };

  // Group tasks by priority for better visualization
  const tasksByPriority = useMemo(() => {
    return {
      high: filteredTasks.filter(t => t.priority === 'high'),
      medium: filteredTasks.filter(t => t.priority === 'medium'),
      low: filteredTasks.filter(t => t.priority === 'low'),
    };
  }, [filteredTasks]);

  // AI Smart Planner state
  const [aiInput, setAIInput] = useState("");
  const [isAIPlanning, setIsAIPlanning] = useState(false);
  const [aiConflictWarning, setAIConflictWarning] = useState<string | null>(null);

  const handleAISmartAdd = async () => {
    if (!aiInput.trim()) return;
    setIsAIPlanning(true);
    setAIConflictWarning(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-plan-event", {
        body: {
          description: aiInput,
          today: new Date().toISOString().split('T')[0],
          existing_events: events.slice(0, 30).map(e => ({ date: e.date, title: e.title })),
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.conflict_warning) setAIConflictWarning(data.conflict_warning);

      // Pre-fill the EventDialog with AI-parsed data
      const prefilledEvent: Partial<PlanningEvent> = {
        title: data.title || "",
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || "",
        type: data.type || "task",
        priority: data.priority || "medium",
        course: data.course || "",
        description: data.description || "",
      } as any;

      setCurrentEvent(prefilledEvent as PlanningEvent);
      setIsEventDialogOpen(true);
      setAIInput("");
      toast({ title: "Event parsed", description: "Review the pre-filled form and save." });
    } catch (err) {
      console.error("AI planning error:", err);
      toast({ title: "AI planning failed", description: "Use the 'New Event' button to add manually.", variant: "destructive" });
    } finally {
      setIsAIPlanning(false);
    }
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
                    <Calendar className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-4xl font-bold tracking-tight">Semester Planning</h1>
                      <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                    </div>
                    <p className="text-primary-foreground/80 text-lg mt-1">
                      Organize your academic calendar and plan future semesters
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="lg" 
                  className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border border-primary-foreground/20 backdrop-blur-sm shadow-lg transition-all hover:scale-105"
                  onClick={() => handleOpenEventDialog()}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Event
                </Button>
                <Button 
                  size="lg" 
                  className="bg-background text-primary hover:bg-background/90 shadow-lg transition-all hover:scale-105"
                  onClick={() => handleOpenTaskDialog()}
                >
                  <ListTodo className="h-5 w-5 mr-2" />
                  Plan Task
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">This Week</p>
                <p className="text-3xl font-bold">{stats.thisWeekEvents}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">Task Progress</p>
                <p className="text-3xl font-bold">{stats.taskProgress}%</p>
              </div>
              <div className="bg-destructive backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">Urgent</p>
                <p className="text-3xl font-bold text-primary-foreground">{stats.urgentDeadlines}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">Future Tasks</p>
                <p className="text-3xl font-bold">{stats.totalFutureTasks}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="p-1.5 bg-muted/70 backdrop-blur-sm rounded-xl grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Calendar className="h-4 w-4" />
              <span>Calendar View</span>
            </TabsTrigger>
            <TabsTrigger value="future" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Layers className="h-4 w-4" />
              <span>Future Planning</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-6 mt-0">
            {/* AI Smart Planner */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Smart Planner</span>
                <Badge variant="secondary" className="text-xs">Beta</Badge>
                <span className="text-xs text-muted-foreground ml-1">Type in plain language — AI will parse the event for you</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder='e.g. "Midterm grading due this Friday" or "Research seminar next Tuesday at 2pm in Science Hall"'
                  value={aiInput}
                  onChange={(e) => setAIInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAISmartAdd(); }}
                  className="text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAISmartAdd}
                  disabled={isAIPlanning || !aiInput.trim()}
                  className="shrink-0"
                >
                  {isAIPlanning
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Wand2 className="h-4 w-4 mr-1" />Add</>}
                </Button>
              </div>
              {aiConflictWarning && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {aiConflictWarning}
                </p>
              )}
            </div>

            {/* Integrations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <OutlookIntegrationConsolidated onSyncComplete={() => {
                eventsQuery.refetch();
                toast({ title: "Outlook synced" });
              }} />
              <GoogleCalendarIntegration onSyncComplete={() => {
                eventsQuery.refetch();
                toast({ title: "Google Calendar synced" });
              }} />
            </div>
            
            {/* Calendar */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                {eventsLoading ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading calendar...</p>
                  </div>
                ) : (
                  <PlanningCalendar 
                    events={events} 
                    onEditEvent={handleOpenEventDialog}
                    onDeleteEvent={handleDeleteEvent}
                    onToggleCompletion={handleToggleCompletion}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="future" className="space-y-6 mt-0">
            {/* Semester Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <p className="text-2xl font-bold">{stats.highPriorityTasks}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Hours</p>
                    <p className="text-2xl font-bold">{stats.totalEstimatedHours}h</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                    <p className="text-2xl font-bold">{stats.totalFutureTasks}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Semester Tabs */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Semester Planning
                    </CardTitle>
                    <CardDescription>Plan and track tasks for upcoming semesters</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenTaskDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeFutureTab} onValueChange={setActiveFutureTab}>
                  <TabsList className="mb-6 flex-wrap h-auto gap-2 bg-transparent p-0">
                    {CURRENT_SEMESTERS.map((semester) => {
                      const Icon = semester.icon;
                      const count = futureTasks.filter(t => t.semester === semester.value).length;
                      return (
                        <TabsTrigger 
                          key={semester.value} 
                          value={semester.value}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4"
                        >
                          <Icon className="h-4 w-4" />
                          {semester.label}
                          {count > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                              {count}
                            </Badge>
                          )}
                        </TabsTrigger>
                      );
                    })}
                    {PAST_SEMESTERS.length > 0 && (
                      <TabsTrigger
                        value="__past__"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPastSemesters(!showPastSemesters);
                        }}
                        className="gap-2 px-4 text-muted-foreground"
                      >
                        <Clock className="h-4 w-4" />
                        Past Semesters
                      </TabsTrigger>
                    )}
                  </TabsList>
                  {showPastSemesters && (
                    <TabsList className="mb-6 flex-wrap h-auto gap-2 bg-transparent p-0">
                      {PAST_SEMESTERS.map((semester) => {
                        const Icon = semester.icon;
                        const count = futureTasks.filter(t => t.semester === semester.value).length;
                        return (
                          <TabsTrigger
                            key={semester.value}
                            value={semester.value}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 opacity-70"
                          >
                            <Icon className="h-4 w-4" />
                            {semester.label}
                            {count > 0 && (
                              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {count}
                              </Badge>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  )}
                  
                  <TabsContent value={activeFutureTab} className="mt-0">
                    {tasksLoading ? (
                      <div className="py-12 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading tasks...</p>
                      </div>
                    ) : filteredTasks.length > 0 ? (
                      <div className="space-y-6">
                        {/* Priority Sections */}
                        {tasksByPriority.high.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-2 w-2 rounded-full bg-destructive" />
                              <h4 className="text-sm font-medium text-muted-foreground">High Priority</h4>
                            </div>
                            <div className="grid gap-3">
                              {tasksByPriority.high.map(task => (
                                <FutureTaskCard 
                                  key={task.id} 
                                  task={task} 
                                  onEdit={() => handleOpenTaskDialog(task)}
                                  onDelete={() => task.id && handleDeleteTask(task.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {tasksByPriority.medium.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              <h4 className="text-sm font-medium text-muted-foreground">Medium Priority</h4>
                            </div>
                            <div className="grid gap-3">
                              {tasksByPriority.medium.map(task => (
                                <FutureTaskCard 
                                  key={task.id} 
                                  task={task} 
                                  onEdit={() => handleOpenTaskDialog(task)}
                                  onDelete={() => task.id && handleDeleteTask(task.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {tasksByPriority.low.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <h4 className="text-sm font-medium text-muted-foreground">Low Priority</h4>
                            </div>
                            <div className="grid gap-3">
                              {tasksByPriority.low.map(task => (
                                <FutureTaskCard 
                                  key={task.id} 
                                  task={task} 
                                  onEdit={() => handleOpenTaskDialog(task)}
                                  onDelete={() => task.id && handleDeleteTask(task.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16 px-4">
                        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <ListTodo className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No tasks for {activeFutureTab}</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                          Start planning ahead by adding tasks and goals for this semester.
                        </p>
                        <Button onClick={() => handleOpenTaskDialog()} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add First Task
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Roadmap */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Academic Roadmap
                </CardTitle>
                <CardDescription>Your long-term academic development plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute h-full w-0.5 bg-gradient-to-b from-primary via-secondary to-accent left-4 top-0 rounded-full" />
                  
                  {[
                    { title: "Curriculum Review", desc: "Update course materials to reflect latest industry practices", status: "in-progress" },
                    { title: "New Course Development", desc: "Create new electives for data science and machine learning", status: "planned" },
                    { title: "Lab Modernization", desc: "Upgrade lab environments and equipment for new curriculum", status: "planned" },
                    { title: "Teaching Innovation", desc: "Implement innovative teaching methods for better engagement", status: "planned" },
                  ].map((item, idx) => (
                    <div key={idx} className="mb-6 relative pl-12 last:mb-0">
                      <span className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        item.status === 'in-progress' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <Badge variant={item.status === 'in-progress' ? 'default' : 'outline'} className="shrink-0">
                          {item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Dialogs */}
        <EventDialog
          open={isEventDialogOpen}
          onOpenChange={setIsEventDialogOpen}
          onSave={handleEventSave}
          event={currentEvent}
          title={currentEvent ? "Edit Event" : "Create New Event"}
        />
        
        <FutureTaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          onSave={handleTaskSave}
          task={currentTask}
          title={currentTask ? "Edit Task" : "Add Future Task"}
          semester={activeFutureTab}
        />
      </div>
    </MainLayout>
  );
};

export default PlanningPage;
