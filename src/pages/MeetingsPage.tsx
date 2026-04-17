import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  Users,
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
  Eye,
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
import { PageGuide } from "@/components/common/PageGuide";

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  scheduled:   { label: "Scheduled",   dot: "bg-primary",     badge: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { label: "In Progress", dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  completed:   { label: "Completed",   dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled:   { label: "Cancelled",   dot: "bg-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
  postponed:   { label: "Postponed",   dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
};

const MeetingCard = ({ meeting, onViewDetails, onEdit }: {meeting: Meeting;onViewDetails: (meeting: Meeting) => void;onEdit: (meeting: Meeting) => void;}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateStatus, deleteMeeting } = useMeetings();

  const cfg = statusConfig[meeting.status] ?? statusConfig.scheduled;

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

  const confirmed = meeting.attendees?.filter(a => a.status === 'accepted').length ?? 0;
  const total = meeting.attendees?.length ?? 0;

  return (
    <Card className="group relative overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200 mb-3">
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.dot}`} />

      <CardContent className="pl-5 pr-4 py-4">
        <div className="flex items-start gap-3">
          {/* Date chip */}
          <div className="hidden sm:flex flex-col items-center justify-center rounded-xl bg-muted/60 border border-border/50 px-3 py-2 min-w-[52px] text-center shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
              {formatDate(meeting.start_date).split(',')[0]}
            </span>
            <span className="text-xl font-bold leading-tight tabular-nums">
              {new Date(meeting.start_date).getDate()}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              {formatDate(meeting.start_date).replace(/^[A-Za-z]+,\s*/, '').replace(/\s+\d+$/, '')}
            </span>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Top row: status badge + badges + menu */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <Badge variant="outline" className="text-[11px] px-2 py-0.5 capitalize">
                  {meeting.type.replace('_', ' ')}
                </Badge>
                {meeting.is_recurring && (
                  <Badge variant="outline" className="text-[11px] px-2 py-0.5 flex items-center gap-1">
                    <Repeat className="h-2.5 w-2.5" />
                    {meeting.recurring_pattern}
                  </Badge>
                )}
                {meeting.reminder_minutes && (
                  <Badge variant="outline" className="text-[11px] px-2 py-0.5 flex items-center gap-1">
                    <Bell className="h-2.5 w-2.5" />
                    {t('meetings.reminder')}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onViewDetails(meeting)}
                  title="View details"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit(meeting)}
                  title="Edit meeting"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[190px]">
                    <DropdownMenuItem onClick={() => onViewDetails(meeting)}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(meeting)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Meeting
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {meeting.status !== "completed" && (
                      <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                        <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Mark Complete
                      </DropdownMenuItem>
                    )}
                    {meeting.status === "completed" && (
                      <DropdownMenuItem onClick={() => handleStatusChange("scheduled")}>
                        <ArrowUp className="h-4 w-4 mr-2 text-blue-500" /> Mark Incomplete
                      </DropdownMenuItem>
                    )}
                    {meeting.status !== "cancelled" && (
                      <DropdownMenuItem onClick={() => handleStatusChange("cancelled")}>
                        <XCircle className="h-4 w-4 mr-2 text-amber-500" /> Cancel Meeting
                      </DropdownMenuItem>
                    )}
                    {meeting.status === "cancelled" && (
                      <DropdownMenuItem onClick={() => handleStatusChange("scheduled")}>
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" /> Reschedule
                      </DropdownMenuItem>
                    )}
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
                            This will permanently delete "{meeting.title}" and all its data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteMeeting} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? t('common.deleting') : t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base leading-snug line-clamp-1 mb-2">{meeting.title}</h3>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="sm:hidden flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(meeting.start_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {meeting.start_time} – {meeting.end_time}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1 max-w-[160px] truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {meeting.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {total} attendee{total !== 1 ? 's' : ''}
                {confirmed > 0 && <span className="text-emerald-600 font-medium">· {confirmed} confirmed</span>}
              </span>
            </div>

            {/* Agenda preview */}
            {meeting.agenda && (
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{meeting.agenda}</span>
              </div>
            )}

            {/* Action items preview */}
            {meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>
                  {meeting.action_items.length} action item{meeting.action_items.length !== 1 ? 's' : ''}
                  {meeting.action_items.length > 0 && (
                    <span className="ml-1 opacity-70">
                      — {typeof meeting.action_items[0] === 'string' ? meeting.action_items[0] : (meeting.action_items[0] as any).description}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA row — always visible */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {meeting.notes ? "Notes added" : "No notes yet"}
          </span>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => onEdit(meeting)}>
              <Edit className="h-3 w-3 mr-1" />
              {t('meetings.reschedule')}
            </Button>
            <Button size="sm" className="h-7 text-xs px-3" onClick={() => onViewDetails(meeting)}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MeetingsPage = () => {
  const { t } = useTranslation();
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
      <div className="animate-fade-in space-y-3">
        <PageGuide page="meetings" />
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl bg-primary p-3 sm:p-5 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 rounded-lg bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold tracking-tight leading-tight">Meetings & 1:1s</h1>
                  <p className="text-primary-foreground/80 text-xs mt-0.5">{t('meetings.scheduleManage')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <QuickAdd
                  type="meeting"
                  onQuickAdd={handleQuickAddMeeting}
                  onOpenFullForm={() => setIsCreateOpen(true)}
                  placeholder={t('meetings.quickAddMeeting')} />

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
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">{t('meetings.upcoming')}</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">This Week</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">{t('meetings.completed')}</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.past}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-[9px] sm:text-xs uppercase tracking-wider">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
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
                placeholder={t('meetings.searchMeetings')}
                className="pl-9 bg-muted/50 border-muted-foreground/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <TabsList className="p-1 bg-muted/70 backdrop-blur-sm rounded-xl grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="upcoming" className="flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
                <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                <span>{t('meetings.upcoming')}</span>
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1 hidden xs:inline-flex">{stats.upcoming}</Badge>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
                <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                <span>{t('meetings.past')}</span>
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1 hidden xs:inline-flex">{stats.past}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{t('meetings.all')}</span>
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
                <h3 className="text-lg font-medium mb-1">{t('meetings.noUpcomingMeetings')}</h3>
                <p className="text-muted-foreground">{t('meetings.noUpcomingDesc')}</p>
                <div className="mt-4">
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('meetings.addMeeting')}
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
                <h3 className="text-lg font-medium mb-1">{t('meetings.noPastMeetings')}</h3>
                <p className="text-muted-foreground">{t('meetings.noPastDesc')}</p>
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
                <h3 className="text-lg font-medium mb-1">{t('meetings.noMeetingsFound')}</h3>
                <p className="text-muted-foreground">{t('common.tryAdjusting')}</p>
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