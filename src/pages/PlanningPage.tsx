import { useTranslation } from "react-i18next";
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
  FlaskConical,
  Users,
  FileText,
  Award,
  Microscope,
  BookMarked,
  Presentation,
  Lightbulb,
  CheckSquare,
  Circle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { PageGuide } from "@/components/common/PageGuide";
import { useToast } from "@/hooks/use-toast";
import { EventDialog } from "@/components/planning/EventDialog";
import { FutureTaskDialog } from "@/components/planning/FutureTaskDialog";
import { OutlookIntegrationConsolidated } from "@/components/planning/OutlookIntegrationConsolidated";
import { GoogleCalendarIntegration } from "@/components/planning/GoogleCalendarIntegration";
import { ProGate } from "@/components/common/ProGate";
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

// ── Semester Focus Plan data ──────────────────────────────────────────────────

type FocusMode = 'teaching' | 'research' | 'both';

interface FocusItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  category: 'teaching' | 'research';
  priority: 'high' | 'medium' | 'low';
}

const TEACHING_ITEMS: FocusItem[] = [
  { id: 't1', title: 'Finalise Course Syllabi', desc: 'Review and update syllabi for each course this semester', icon: BookOpen, category: 'teaching', priority: 'high' },
  { id: 't2', title: 'Prepare Lecture Materials', desc: 'Build or refresh slides, readings, and in-class activities', icon: Presentation, category: 'teaching', priority: 'high' },
  { id: 't3', title: 'Set Assessment Schedule', desc: 'Plan assignments, quizzes, and exam dates on the calendar', icon: CalendarDays, category: 'teaching', priority: 'high' },
  { id: 't4', title: 'Student Office Hours', desc: 'Establish and communicate regular office hour slots', icon: Users, category: 'teaching', priority: 'medium' },
  { id: 't5', title: 'Midterm Grade Review', desc: 'Analyse midterm results and identify students needing support', icon: Target, category: 'teaching', priority: 'medium' },
  { id: 't6', title: 'End-of-Semester Reflection', desc: 'Document what worked, what to improve for next semester', icon: Lightbulb, category: 'teaching', priority: 'low' },
];

const RESEARCH_ITEMS: FocusItem[] = [
  { id: 'r1', title: 'Grant Application Deadlines', desc: 'Track and submit grant proposals before cutoff dates', icon: Award, category: 'research', priority: 'high' },
  { id: 'r2', title: 'Active Experiments / Studies', desc: 'Monitor ongoing experiments, data collection, or fieldwork', icon: FlaskConical, category: 'research', priority: 'high' },
  { id: 'r3', title: 'Manuscript / Paper Drafting', desc: 'Set milestones for writing and revising research papers', icon: FileText, category: 'research', priority: 'high' },
  { id: 'r4', title: 'Conference Submissions', desc: 'Submit abstracts or papers to target conferences', icon: Presentation, category: 'research', priority: 'medium' },
  { id: 'r5', title: 'Literature Review Update', desc: 'Stay current with new publications in your research area', icon: BookMarked, category: 'research', priority: 'medium' },
  { id: 'r6', title: 'Collaborate with Research Team', desc: 'Schedule check-ins with co-investigators, students, or collaborators', icon: Users, category: 'research', priority: 'medium' },
  { id: 'r7', title: 'IRB / Ethics Submissions', desc: 'Prepare or renew protocol approvals for human-subjects research', icon: Microscope, category: 'research', priority: 'low' },
];

function detectFocusMode(position: string | null): FocusMode {
  if (!position) return 'both';
  const p = position.toLowerCase();
  const isResearch = p.includes('research') || p.includes('scientist') || p.includes('investigator') || p.includes('postdoc');
  const isTeaching = p.includes('teach') || p.includes('instructor') || p.includes('lecturer') || p.includes('adjunct');
  if (isResearch && !isTeaching) return 'research';
  if (isTeaching && !isResearch) return 'teaching';
  return 'both';
}

// ─────────────────────────────────────────────────────────────────────────────

const PlanningPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile } = useProfile();
  
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

  // Semester Focus Plan state
  const autoFocus = useMemo(() => detectFocusMode(profile?.position ?? null), [profile?.position]);
  const [focusMode, setFocusMode] = useState<FocusMode | null>(null);
  const activeFocus: FocusMode = focusMode ?? autoFocus;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const focusItems = useMemo(() => {
    if (activeFocus === 'teaching') return TEACHING_ITEMS;
    if (activeFocus === 'research') return RESEARCH_ITEMS;
    return [...TEACHING_ITEMS, ...RESEARCH_ITEMS];
  }, [activeFocus]);

  const focusProgress = focusItems.length > 0
    ? Math.round((checkedItems.size / focusItems.length) * 100)
    : 0;

  const toggleFocusItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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

      // FunctionsHttpError: edge function returned non-2xx - extract real message
      if (error) {
        let msg = error.message ?? "Edge function error";
        try {
          const ctx = await (error as any).context?.json?.();
          if (ctx?.error) msg = ctx.error;
        } catch { /* ignore */ }
        console.error("AI planning invoke error:", msg);
        // Fall back: open dialog pre-filled with raw text so user isn't blocked
        openFallbackDialog();
        return;
      }

      // Edge function always returns 200; errors come as { error: "..." }
      if (data?.error) {
        console.warn("AI planning returned error:", data.error);
        openFallbackDialog();
        return;
      }

      if (data?.conflict_warning) setAIConflictWarning(data.conflict_warning);

      const validTypes = ['event', 'task', 'deadline', 'meeting'];
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      const prefilledEvent: Partial<PlanningEvent> = {
        title: data.title || aiInput.slice(0, 80),
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || "",
        type: validTypes.includes(data.type) ? data.type : "task",
        priority: validPriorities.includes(data.priority) ? data.priority : "medium",
        course: data.course || "",
        description: data.description || "",
      } as any;

      setCurrentEvent(prefilledEvent as PlanningEvent);
      setIsEventDialogOpen(true);
      setAIInput("");
      toast({ title: "Event parsed", description: "Review the pre-filled form and save." });
    } catch (err) {
      console.error("AI planning error:", err);
      openFallbackDialog();
    } finally {
      setIsAIPlanning(false);
    }
  };

  // Opens the new-event dialog pre-filled with whatever the user typed so they're never blocked
  const openFallbackDialog = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCurrentEvent({
      title: aiInput.slice(0, 80),
      date: tomorrow.toISOString().split('T')[0],
      time: "",
      type: "task",
      priority: "medium",
      course: "",
      description: aiInput,
    } as any);
    setIsEventDialogOpen(true);
    setAIInput("");
    toast({ title: "AI unavailable", description: "Form pre-filled - adjust details and save.", variant: "default" });
  };

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-3">
        <PageGuide page="planning" />
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl bg-primary p-3 sm:p-5 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 rounded-lg bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl shrink-0">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-xl font-bold tracking-tight leading-tight">{t('planning.title')}</h1>
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent animate-pulse shrink-0" />
                  </div>
                  <p className="text-primary-foreground/80 text-xs mt-0.5">
                    Organize your academic calendar and plan future semesters
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  size="sm"
                  className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border border-primary-foreground/20 backdrop-blur-sm shadow-lg transition-all hover:scale-105"
                  onClick={() => handleOpenEventDialog()}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Event
                </Button>
                <Button
                  size="sm"
                  className="bg-background text-primary hover:bg-background/90 shadow-lg transition-all hover:scale-105"
                  onClick={() => handleOpenTaskDialog()}
                >
                  <ListTodo className="h-4 w-4 mr-1.5" />
                  Plan Task
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">{t('analytics.thisWeek')}</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.thisWeekEvents}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">{t('planning.progress')}</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.taskProgress}%</p>
              </div>
              <div className="bg-amber-500/70 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">{t('planning.urgent')}</p>
                <p className="text-lg sm:text-2xl font-bold text-primary-foreground">{stats.urgentDeadlines}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">{t('planning.future')}</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalFutureTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="p-1 bg-muted/70 backdrop-blur-sm rounded-xl grid w-full sm:max-w-md grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>{t('planning.calendarView')}</span>
            </TabsTrigger>
            <TabsTrigger value="future" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>{t('planning.futurePlanning')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-4 mt-0">
            {/* AI Smart Planner */}
            <ProGate featureKey="planning_ai_event" featureLabel="AI Smart Planner">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">AI Smart Planner</span>
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                  <span className="text-xs text-muted-foreground ml-1">Type in plain language - AI will parse the event for you</span>
                </div>
                <div className="flex flex-col xs:flex-row gap-2">
                  <Input
                    placeholder='e.g. "Midterm grading due this Friday"'
                    value={aiInput}
                    onChange={(e) => setAIInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAISmartAdd(); }}
                    className="text-sm flex-1"
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
            </ProGate>

            {/* Calendar */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                {eventsLoading ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('planning.loadingCalendar')}</p>
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

            {/* Calendar Integrations - below calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProGate featureKey="planning_outlook_sync" featureLabel="Outlook Calendar Sync">
                <OutlookIntegrationConsolidated onSyncComplete={() => {
                  eventsQuery.refetch();
                  toast({ title: "Outlook synced" });
                }} />
              </ProGate>
              <ProGate featureKey="planning_google_sync" featureLabel="Google Calendar Sync">
                <GoogleCalendarIntegration onSyncComplete={() => {
                  eventsQuery.refetch();
                  toast({ title: "Google Calendar synced" });
                }} />
              </ProGate>
            </div>
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
                    <CardDescription>{t('planning.planAndTrack')}</CardDescription>
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
                        <p className="text-muted-foreground">{t('planning.loadingTasks')}</p>
                      </div>
                    ) : filteredTasks.length > 0 ? (
                      <div className="space-y-6">
                        {/* Priority Sections */}
                        {tasksByPriority.high.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-2 w-2 rounded-full bg-destructive" />
                              <h4 className="text-sm font-medium text-muted-foreground">{t('planning.highPriority')}</h4>
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
                              <h4 className="text-sm font-medium text-muted-foreground">{t('planning.mediumPriority')}</h4>
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
                              <h4 className="text-sm font-medium text-muted-foreground">{t('planning.lowPriority')}</h4>
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
            
            {/* Semester Focus Plan */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-5 w-5 text-primary" />
                      Semester Focus Plan
                    </CardTitle>
                    <CardDescription className="mt-0.5">
                      {activeFocus === 'teaching' && 'Teaching-focused priorities for this semester'}
                      {activeFocus === 'research' && 'Research-focused priorities for this semester'}
                      {activeFocus === 'both' && 'Teaching & research priorities for this semester'}
                    </CardDescription>
                  </div>
                  {/* Role toggle */}
                  <div className="flex items-center gap-1 bg-muted/70 rounded-lg p-1 shrink-0 self-start">
                    {(['teaching', 'research', 'both'] as FocusMode[]).map(mode => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setFocusMode(mode === autoFocus && focusMode !== null ? null : mode)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                          activeFocus === mode
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {mode === 'both' ? 'Both' : mode === 'teaching' ? 'Teaching' : 'Research'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{checkedItems.size} of {focusItems.length} completed</span>
                    <span className="font-medium text-foreground">{focusProgress}%</span>
                  </div>
                  <Progress value={focusProgress} className="h-1.5" />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-1">
                  {focusItems.map((item) => {
                    const Icon = item.icon;
                    const done = checkedItems.has(item.id);
                    const priorityColor = item.priority === 'high'
                      ? 'text-red-500'
                      : item.priority === 'medium'
                        ? 'text-amber-500'
                        : 'text-emerald-500';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleFocusItem(item.id)}
                        className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 group ${
                          done
                            ? 'bg-muted/40 opacity-60'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Check icon */}
                        <span className="mt-0.5 shrink-0">
                          {done
                            ? <CheckSquare className="h-4 w-4 text-primary" />
                            : <Circle className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                          }
                        </span>
                        {/* Icon */}
                        <span className={`mt-0.5 shrink-0 ${done ? 'text-muted-foreground' : 'text-primary/70'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                        {/* Priority dot + category */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 capitalize ${
                              item.category === 'teaching'
                                ? 'border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400'
                                : 'border-violet-200 text-violet-600 dark:border-violet-800 dark:text-violet-400'
                            }`}
                          >
                            {item.category}
                          </Badge>
                          <span className={`text-[9px] font-semibold uppercase tracking-wide ${priorityColor}`}>
                            {item.priority}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {focusProgress === 100 && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      All focus items complete - great semester!
                    </p>
                  </div>
                )}
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
