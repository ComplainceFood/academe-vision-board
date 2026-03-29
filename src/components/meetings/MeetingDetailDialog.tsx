import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, FileText, Bell, Check, X, Repeat, Trash2, Edit } from "lucide-react";
import { MeetingAISummarizer } from "./MeetingAISummarizer";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useRefreshContext } from "@/App";
import { Meeting, AttendeeInfo } from "@/types/meetings";

interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingDetailDialog({ meeting, isOpen, onOpenChange }: MeetingDetailDialogProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newActionItem, setNewActionItem] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const { triggerRefresh } = useRefreshContext();

  useEffect(() => {
    if (meeting?.notes) {
      setMeetingNotes(meeting.notes);
    } else {
      setMeetingNotes("");
    }
    setIsEditingNotes(false);
  }, [meeting]);

  if (!meeting) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getParticipants = (): AttendeeInfo[] => {
    if (!meeting.attendees) return [];
    return meeting.attendees;
  };

  const handleAddActionItem = async () => {
    if (!newActionItem.trim()) return;
    
    try {
      setIsUpdating(true);
      
      const newItem = {
        id: Date.now().toString(),
        description: newActionItem.trim(),
        assignee: "",
        due_date: "",
        completed: false,
        created_at: new Date().toISOString()
      };
      
      const updatedActionItems = [...(meeting.action_items || []), newItem];
      
      const { error } = await supabase
        .from("meetings")
        .update({ action_items: updatedActionItems as any })
        .eq("id", meeting.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Action item added successfully",
      });
      
      setNewActionItem("");
      triggerRefresh('meetings');
    } catch (error) {
      console.error("Error adding action item:", error);
      toast({
        title: "Error",
        description: "Failed to add action item",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteActionItem = async (index: number) => {
    try {
      setIsUpdating(true);
      
      const updatedActionItems = [...(meeting.action_items || [])];
      updatedActionItems.splice(index, 1);
      
      const { error } = await supabase
        .from("meetings")
        .update({ action_items: updatedActionItems as any })
        .eq("id", meeting.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Action item removed",
      });
      
      triggerRefresh('meetings');
    } catch (error) {
      console.error("Error removing action item:", error);
      toast({
        title: "Error",
        description: "Failed to remove action item",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateParticipantStatus = async (participant: string, status: string) => {
    try {
      setIsUpdating(true);
      
      const updatedAttendees = meeting.attendees.map(attendee => 
        attendee.name === participant 
          ? { ...attendee, status: status as any }
          : attendee
      );
      
      const { error } = await supabase
        .from("meetings")
        .update({ attendees: updatedAttendees })
        .eq("id", meeting.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Participant status updated`,
      });
      
      triggerRefresh('meetings');
    } catch (error) {
      console.error("Error updating participant status:", error);
      toast({
        title: "Error",
        description: "Failed to update participant status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from("meetings")
        .update({ notes: meetingNotes })
        .eq("id", meeting.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Meeting notes saved",
      });
      
      setIsEditingNotes(false);
      triggerRefresh('meetings');
    } catch (error) {
      console.error("Error saving meeting notes:", error);
      toast({
        title: "Error",
        description: "Failed to save meeting notes",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors = {
    scheduled: "bg-primary/15 text-primary",
    in_progress: "bg-orange-100 text-orange-700",
    completed: "bg-secondary/15 text-secondary",
    cancelled: "bg-destructive/15 text-destructive",
    postponed: "bg-yellow-100 text-yellow-700"
  };

  const participantStatusColors = {
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    tentative: "bg-blue-100 text-blue-800"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{meeting.title}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[meeting.status]}`}>
              {meeting.status}
            </span>
            <Badge variant="outline">{meeting.type}</Badge>
            {meeting.is_recurring && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                <span>{meeting.recurring_pattern}</span>
              </Badge>
            )}
            {meeting.reminder_minutes && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                <span>Reminder: {meeting.reminder_minutes}min</span>
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(meeting.start_date)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{meeting.start_time} - {meeting.end_time}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {meeting.attendees?.length || 0} attendee{meeting.attendees?.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{meeting.location}</span>
            </div>
          </div>
          
          {meeting.agenda && (
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Agenda
              </h3>
              <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                {meeting.agenda}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-md font-semibold mb-2">Participants</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getParticipants().map((participant) => (
                  <TableRow key={participant.name}>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${participantStatusColors[participant.status]}`}>
                        {participant.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => updateParticipantStatus(participant.name, "accepted")}
                          disabled={participant.status === "accepted" || isUpdating}
                          className="h-8 w-8 text-green-500"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => updateParticipantStatus(participant.name, "declined")}
                          disabled={participant.status === "declined" || isUpdating}
                          className="h-8 w-8 text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <MeetingAISummarizer
            meetingId={meeting.id}
            title={meeting.title}
            agenda={meeting.agenda}
            notes={meetingNotes}
            onActionItemsAdded={() => triggerRefresh('meetings')}
          />

          <div>
            <h3 className="text-md font-semibold mb-2">Action Items</h3>
            {meeting.action_items && meeting.action_items.length > 0 ? (
              <ul className="space-y-2">
                {meeting.action_items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 bg-muted/50 p-2 rounded-md">
                    <Check className="h-4 w-4 text-secondary mt-1" />
                    <span className="flex-1">{typeof item === 'string' ? item : item.description}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteActionItem(index)}
                      disabled={isUpdating}
                      className="h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No action items yet</p>
            )}
            
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 px-3 py-2 text-sm border rounded-md"
                placeholder="Add new action item"
                value={newActionItem}
                onChange={(e) => setNewActionItem(e.target.value)}
                disabled={isUpdating}
              />
              <Button 
                onClick={handleAddActionItem} 
                disabled={!newActionItem.trim() || isUpdating} 
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-semibold">Meeting Notes</h3>
              {!isEditingNotes ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingNotes(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit Notes
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setMeetingNotes(meeting.notes || "");
                      setIsEditingNotes(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
            
            {isEditingNotes ? (
              <Textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Enter meeting notes here..."
                className="min-h-[150px]"
                disabled={isUpdating}
              />
            ) : (
              <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap min-h-[100px]">
                {meeting.notes || "No meeting notes yet. Click 'Edit Notes' to add some."}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}