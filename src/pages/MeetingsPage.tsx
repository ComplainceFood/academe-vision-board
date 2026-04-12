import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  Search,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  XCircle,
  MoreVertical,
  FileText,
  Bell,
  MapPin,
  Repeat,
  Check,
  Edit,
  Trash2 } from
"lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CreateMeetingDialog } from "@/components/meetings/CreateMeetingDialog";
import { MeetingDetailDialog } from "@/components/meetings/MeetingDetailDialog";
import { EditMeetingDialog } from "@/components/meetings/EditMeetingDialog";
import { QuickAdd, QuickAddData } from "@/components/common/QuickAdd";
import type { Meeting } from "@/types/meetings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid, addDays } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuth } from "@/hooks/useAuth";

const MeetingCard = ({ meeting, onViewDetails, onEdit }: {meeting: Meeting;onViewDetails: (meeting: Meeting) => void;onEdit: (meeting: Meeting) => void;}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateStatus, deleteMeeting } = useMeetings();

  const statusColors = {
    scheduled: "bg-primary/15 text-primary",
    in_progress: "bg-accent/15 text-accent-foreground dark:text-accent",
    completed: "bg-secondary/15 text-secondary-foreground dark:text-secondary",
    cancelled: "bg-destructive/15 text-destructive",
    postponed: "bg-muted text-muted-foreground"
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Invalid date";
      const date = new Date(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'EEE, MMM d');
    } catch (e) {
      return dateString;
    }
  };

  const handleStatusChange = async (newStatus: Meeting['status']) => {
    try {
      await updateStatus({ id: meeting.id, status: newStatus });
    } catch (error) {
      console.error("Error updating meeting status:", error);
    }
  };

  const handleDeleteMeeting = async () => {
    try {
      setIsDeleting(true);
      await deleteMeeting(meeting.id);
    } catch (error) {
      console.error("Error deleting meeting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getParticipantStatuses = () => {
    if (!meeting.attendees || !Array.isArray(meeting.attendees)) return { confirmed: 0, declined: 0, pending: 0 };

    return meeting.attendees.reduce(
      (acc, attendee) => {
        if (attendee.status === 'accepted') acc.confirmed++;else
        if (attendee.status === 'declined') acc.declined++;else
        acc.pending++;
        return acc;
      },
      { confirmed: 0, declined: 0, pending: 0 }
    );
  };

  const statuses = getParticipantStatuses();

  return (
    <Card className="mb-4 glassmorphism">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[meeting.status]}`}>
                {meeting.status}
              </span>
              <Badge variant="outline">{meeting.type}</Badge>
              
              {meeting.is_recurring &&
              <Badge variant="outline" className="flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  <span>{meeting.recurring_pattern}</span>
                </Badge>
              }
              
              {meeting.reminder_minutes &&
              <Badge variant="outline" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  <span>Reminder</span>
                </Badge>
              }
            </div>
            <CardTitle className="text-lg">{meeting.title}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] sm:w-[200px]">
              <DropdownMenuItem onClick={() => onViewDetails(meeting)}>
                <FileText className="h-4 w-4 mr-2" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(meeting)}>
                <Edit className="h-4 w-4 mr-2" /> Edit Meeting
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {meeting.status !== "completed" &&
              <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Mark Complete
                </DropdownMenuItem>
              }
              {meeting.status === "completed" &&
              <DropdownMenuItem onClick={() => handleStatusChange("scheduled")}>
                  <ArrowUp className="h-4 w-4 mr-2 text-blue-500" /> Mark Incomplete
                </DropdownMenuItem>
              }
              {meeting.status !== "cancelled" &&
              <DropdownMenuItem onClick={() => handleStatusChange("cancelled")}>
                  <XCircle className="h-4 w-4 mr-2 text-yellow-500" /> Cancel Meeting
                </DropdownMenuItem>
              }
              {meeting.status === "cancelled" &&
              <DropdownMenuItem onClick={() => handleStatusChange("scheduled")}>
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" /> Reschedule
                </DropdownMenuItem>
              }
              
              <DropdownMenuSeparator />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Meeting
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the meeting "{meeting.title}" and all associated data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMeeting} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(meeting.start_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.start_time} - {meeting.end_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate max-w-[120px] sm:max-w-[200px]">{meeting.location}</span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1">
            <span className="text-sm">{meeting.attendees?.length || 0} attendees</span>
            {(statuses.confirmed > 0 || statuses.declined > 0) &&
            <span className="text-xs text-muted-foreground">
                ({statuses.confirmed} confirmed, {statuses.declined} declined)
              </span>
            }
          </div>
        </div>
        
        {meeting.agenda &&
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm mb-2 font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Agenda:
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">{meeting.agenda}</p>
          </div>
        }
        
        {meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 &&
        <div className="mt-3">
            <p className="text-sm font-medium mb-1">Action Items:</p>
            <ul className="text-sm">
              {meeting.action_items.slice(0, 2).map((item, index) =>
            <li key={index} className="flex items-start gap-2 mb-1">
                  <Check className="h-4 w-4 text-secondary mt-0.5" />
                  <span className="line-clamp-1">
                    {typeof item === 'string' ? item : item.description}
                  </span>
                </li>
            )}
              {meeting.action_items.length > 2 &&
            <li className="text-xs text-muted-foreground">
                  +{meeting.action_items.length - 2} more items
                </li>
            }
            </ul>
          </div>
        }
      </CardContent>
      
      {meeting.status === "scheduled" &&
      <CardFooter className="pt-0 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(meeting)}>Reschedule</Button>
          <Button size="sm" className="flex-1" onClick={() => onViewDetails(meeting)}>
            View Details
          </Button>
        </CardFooter>
      }
    </Card>);

};

const MeetingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { meetings, isLoading, createMeeting } = useMeetings();
  const { user } = useAuth();

  // Calculate stats
  const stats = {
    upcoming: (meetings || []).filter((m) => m.status === "scheduled" && new Date(m.start_date) >= new Date()).length,
    past: (meetings || []).filter((m) => m.status === "completed").length,
    total: (meetings || []).length,
    thisWeek: (meetings || []).filter((m) => {
      const meetingDate = new Date(m.start_date);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return meetingDate >= today && meetingDate <= nextWeek && m.status === "scheduled";
    }).length
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('refreshData'));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailOpen(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsEditOpen(true);
  };

  const filteredMeetings = (meetings || []).filter((meeting) => {
    const matchesSearch =
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(meeting.attendees) && meeting.attendees.some((attendee) =>
        attendee.name.toLowerCase().includes(searchQuery.toLowerCase())
      )) ||
      (meeting.agenda && meeting.agenda.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (meeting.location && meeting.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab =
      (activeTab === "upcoming" && (meeting.status === "scheduled" || meeting.status === "in_progress") && new Date(meeting.start_date) >= new Date()) ||
      (activeTab === "past" && (meeting.status === "completed" || meeting.status === "postponed" || meeting.status === "cancelled")) ||
      activeTab === "all";

    return matchesSearch && matchesTab;
  });

  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    try {
      if (activeTab === "upcoming") {
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      } else {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    } catch (e) {
      return 0;
    }
  });

  const handleQuickAddMeeting = async (data: QuickAddData) => {
    if (!user) throw new Error("Not authenticated");

    const tomorrow = addDays(new Date(), 1);
    const formattedDate = format(tomorrow, 'yyyy-MM-dd');

    await createMeeting({
      title: data.title,
      type: data.type === "group" ? "group" : "one_on_one",
      start_date: formattedDate,
      start_time: "10:00",
      end_time: "11:00",
      location: data.location || "TBD",
      attendees: [],
      is_recurring: false,
      reminder_minutes: 15
    });
  };

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-primary p-5 sm:p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl shrink-0">
                  <Calendar className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight leading-tight">Meetings & 1:1s</h1>
                  <p className="text-primary-foreground/80 text-xs sm:text-base mt-0.5">Schedule and manage your meetings</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <QuickAdd
                  type="meeting"
                  onQuickAdd={handleQuickAddMeeting}
                  onOpenFullForm={() => setIsCreateOpen(true)}
                  placeholder="Quick add meeting..." />

                <Button
                  onClick={() => setIsCreateOpen(true)}
                  size="sm"
                  className="bg-background text-primary hover:bg-background/90 shadow-lg transition-all hover:scale-105 sm:size-lg">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Schedule
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-2 sm:py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">Upcoming</p>
                <p className="text-xl sm:text-3xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-2 sm:py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">This Week</p>
                <p className="text-xl sm:text-3xl font-bold">{stats.thisWeek}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-2 sm:py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">Completed</p>
                <p className="text-xl sm:text-3xl font-bold">{stats.past}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-2 sm:py-3 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">Total</p>
                <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                className="pl-9 bg-muted/50 border-muted-foreground/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <TabsList className="p-1 bg-muted/70 backdrop-blur-sm rounded-xl grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="upcoming" className="flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
                <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                <span>Upcoming</span>
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1 hidden xs:inline-flex">{stats.upcoming}</Badge>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
                <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                <span>Past</span>
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1 hidden xs:inline-flex">{stats.past}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>All</span>
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1 hidden xs:inline-flex">{stats.total}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="upcoming" className="mt-4">
            {isLoading ?
            <div className="text-center py-12">Loading meetings...</div> :
            sortedMeetings.length > 0 ?
            sortedMeetings.map((meeting) =>
            <MeetingCard key={meeting.id} meeting={meeting} onViewDetails={handleViewDetails} onEdit={handleEditMeeting} />
            ) :
            <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No upcoming meetings</h3>
                <p className="text-muted-foreground">Schedule a new meeting to get started</p>
                <div className="mt-4">
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              </div>
            }
          </TabsContent>
          
          <TabsContent value="past" className="mt-4">
            {isLoading ?
            <div className="text-center py-12">Loading meetings...</div> :
            sortedMeetings.length > 0 ?
            sortedMeetings.map((meeting) =>
            <MeetingCard key={meeting.id} meeting={meeting} onViewDetails={handleViewDetails} onEdit={handleEditMeeting} />
            ) :
            <div className="text-center py-12">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No past meetings</h3>
                <p className="text-muted-foreground">Past meetings will appear here</p>
              </div>
            }
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            {isLoading ?
            <div className="text-center py-12">Loading meetings...</div> :
            sortedMeetings.length > 0 ?
            sortedMeetings.map((meeting) =>
            <MeetingCard key={meeting.id} meeting={meeting} onViewDetails={handleViewDetails} onEdit={handleEditMeeting} />
            ) :
            <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No meetings found</h3>
                <p className="text-muted-foreground">Try adjusting your search</p>
              </div>
            }
          </TabsContent>
        </Tabs>
      </div>
      
      <MeetingDetailDialog
        meeting={selectedMeeting}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen} />

      
      <CreateMeetingDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen} />


      <EditMeetingDialog
        meeting={selectedMeeting}
        open={isEditOpen}
        onOpenChange={setIsEditOpen} />

    </MainLayout>);

};

export default MeetingsPage;