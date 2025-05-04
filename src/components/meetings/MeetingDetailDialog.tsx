import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, FileText, Bell, Check, X, Repeat } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Participant {
  name: string;
  status: "confirmed" | "declined" | "pending";
}

interface Meeting {
  id: string;
  title: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled";
  date: string;
  time: string;
  duration: string;
  attendees: string[];
  location: string;
  notes?: string;
  action_items?: string[];
  agenda?: string;
  is_recurring?: boolean;
  recurring_type?: string;
  reminder_enabled?: boolean;
  reminder_time?: string;
  participant_status?: Record<string, string>;
}

interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingDetailDialog({ meeting, isOpen, onOpenChange }: MeetingDetailDialogProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newActionItem, setNewActionItem] = useState("");

  if (!meeting) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getParticipants = (): Participant[] => {
    if (!meeting.attendees) return [];
    
    return meeting.attendees.map(name => ({
      name,
      status: ((meeting.participant_status?.[name] || "pending") as "confirmed" | "declined" | "pending")
    }));
  };

  const handleAddActionItem = async () => {
    if (!newActionItem.trim()) return;
    
    try {
      setIsUpdating(true);
      
      const updatedActionItems = [...(meeting.action_items || []), newActionItem.trim()];
      
      const { error } = await supabase
        .from("meetings")
        .update({ action_items: updatedActionItems })
        .eq("id", meeting.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Action item added successfully",
      });
      
      setNewActionItem("");
      
      // Trigger a refresh
      window.dispatchEvent(new Event("seedDataCompleted"));
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

  const updateParticipantStatus = async (participant: string, status: string) => {
    try {
      setIsUpdating(true);
      
      // Get the current participant status or initialize it
      const updatedStatuses = { ...(meeting.participant_status || {}) };
      updatedStatuses[participant] = status;
      
      // Using the correct type for the update operation
      const { error } = await supabase
        .from("meetings")
        .update({ participant_status: updatedStatuses })
        .eq("id", meeting.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Participant status updated`,
      });
      
      // Trigger a refresh
      window.dispatchEvent(new Event("seedDataCompleted"));
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

  const statusColors = {
    scheduled: "bg-primary/15 text-primary",
    completed: "bg-secondary/15 text-secondary",
    cancelled: "bg-destructive/15 text-destructive"
  };

  const participantStatusColors = {
    confirmed: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800"
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
                <span>{meeting.recurring_type}</span>
              </Badge>
            )}
            {meeting.reminder_enabled && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                <span>Reminder: {meeting.reminder_time}</span>
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(meeting.date)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{meeting.time} ({meeting.duration})</span>
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
                          onClick={() => updateParticipantStatus(participant.name, "confirmed")}
                          disabled={participant.status === "confirmed" || isUpdating}
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
          
          <div>
            <h3 className="text-md font-semibold mb-2">Action Items</h3>
            {meeting.action_items && meeting.action_items.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 pl-2">
                {meeting.action_items.map((item, index) => (
                  <li key={index} className="text-sm">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-secondary mt-0.5" />
                      <span>{item}</span>
                    </div>
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
          
          {meeting.notes && (
            <div>
              <h3 className="text-md font-semibold mb-2">Notes</h3>
              <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                {meeting.notes}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
