import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ListTodo,
} from "lucide-react";
import { useState } from "react";
import { EventDialog } from "@/components/planning/EventDialog";
import { FutureTaskDialog } from "@/components/planning/FutureTaskDialog";
import { OutlookIntegration } from "@/components/planning/OutlookIntegration";
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

const PlanningPage = () => {
  // Fetch planning data
  const { data: eventsData = [], isLoading: eventsLoading } = usePlanningEvents();
  const { data: futureTasksData = [], isLoading: tasksLoading } = useFuturePlanning();
  
  // Ensure proper typing for our data
  const events = eventsData as PlanningEvent[];
  const futureTasks = futureTasksData as FutureTask[];
  
  // Event actions
  const { createPlanningEvent, updatePlanningEvent, toggleEventCompletion, deletePlanningEvent } = usePlanningEventActions();
  const { createFutureTask, updateFutureTask, deleteFutureTask } = useFutureTaskActions();

  // Dialog states
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PlanningEvent | undefined>(undefined);
  const [currentTask, setCurrentTask] = useState<FutureTask | undefined>(undefined);
  
  // Tab states
  const [activeFutureTab, setActiveFutureTab] = useState("Fall 2025");

  // Handle event dialog
  const handleOpenEventDialog = (event?: PlanningEvent) => {
    setCurrentEvent(event);
    setIsEventDialogOpen(true);
  };

  // Handle task dialog
  const handleOpenTaskDialog = (task?: FutureTask) => {
    setCurrentTask(task);
    setIsTaskDialogOpen(true);
  };

  // Handle event save
  const handleEventSave = async (eventData: EventFormData) => {
    if (currentEvent?.id) {
      await updatePlanningEvent({ id: currentEvent.id, updates: eventData });
    } else {
      await createPlanningEvent(eventData);
    }
  };

  // Handle task save
  const handleTaskSave = async (taskData: FutureTaskFormData) => {
    if (currentTask?.id) {
      await updateFutureTask({ id: currentTask.id, updates: taskData });
    } else {
      await createFutureTask({...taskData, semester: activeFutureTab});
    }
  };

  // Handle task semester filter - ensure type safety
  const filteredTasks = futureTasks.filter(task => {
    return task.semester === activeFutureTab;
  });

  // Fixed function to handle toggle completion properly
  const handleToggleCompletion = async (id: string, completed: boolean) => {
    await toggleEventCompletion({ id, completed });
  };

  // Fixed function to handle event deletion properly
  const handleDeleteEvent = async (id: string) => {
    await deletePlanningEvent(id);
  };

  // Fixed function to handle task deletion properly
  const handleDeleteTask = async (id: string) => {
    await deleteFutureTask(id);
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Semester & Planning</h1>
            <p className="text-muted-foreground">Plan your schedule and upcoming semesters</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button className="flex items-center gap-2" onClick={() => handleOpenEventDialog()}>
              <Plus className="h-4 w-4" />
              <span>New Event</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => handleOpenTaskDialog()}>
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
            <div className="space-y-6">
              <OutlookIntegration onSyncComplete={() => window.location.reload()} />
              
              <Card className="glassmorphism">
                <CardContent className="p-6">
                  {eventsLoading ? (
                    <div className="py-12 text-center">Loading calendar...</div>
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
            </div>
          </TabsContent>
          
          <TabsContent value="future" className="mt-4">
            <Card className="glassmorphism">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Future Semester Planning</CardTitle>
                  <Button className="flex items-center gap-2" onClick={() => handleOpenTaskDialog()}>
                    <Plus className="h-4 w-4" />
                    <span>Add Task</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeFutureTab} onValueChange={setActiveFutureTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="Fall 2025">Fall 2025</TabsTrigger>
                    <TabsTrigger value="Spring 2026">Spring 2026</TabsTrigger>
                    <TabsTrigger value="Fall 2026">Fall 2026</TabsTrigger>
                    <TabsTrigger value="Spring 2027">Spring 2027</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeFutureTab}>
                    <div className="space-y-3">
                      {tasksLoading ? (
                        <div className="py-12 text-center">Loading tasks...</div>
                      ) : filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                          <FutureTaskCard 
                            key={task.id} 
                            task={task} 
                            onEdit={() => handleOpenTaskDialog(task)}
                            onDelete={() => task.id && handleDeleteTask(task.id)}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium mb-1">No tasks planned</h3>
                          <p className="text-muted-foreground">Add tasks for {activeFutureTab} semester</p>
                          <Button 
                            className="mt-4" 
                            onClick={() => handleOpenTaskDialog(undefined)}
                          >
                            Add Task
                          </Button>
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
        
        {/* Event Dialog */}
        <EventDialog
          open={isEventDialogOpen}
          onOpenChange={setIsEventDialogOpen}
          onSave={handleEventSave}
          event={currentEvent}
          title={currentEvent ? "Edit Event" : "Create New Event"}
        />
        
        {/* Future Task Dialog */}
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
