import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRefreshContext } from "@/App";
import { useDataFetching } from "@/hooks/useDataFetching";
import { FundingSource } from "@/types/funding";

interface CreateMeetingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMeetingDialog({ isOpen, onOpenChange }: CreateMeetingDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"1:1" | "group">("1:1");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [agenda, setAgenda] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGrantMeeting, setIsGrantMeeting] = useState(false);
  const [selectedFundingSourceId, setSelectedFundingSourceId] = useState<string>("");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerRefresh } = useRefreshContext();

  const { data: fundingSources } = useDataFetching<FundingSource>({
    table: 'funding_sources',
    enabled: !!user && isGrantMeeting,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !location || !user) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const attendeesList = attendees
        .split(',')
        .map(attendee => attendee.trim())
        .filter(attendee => attendee !== "");

      const formattedDate = format(date, 'yyyy-MM-dd');
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const endTime = `${(hours + 1).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const { error } = await supabase.from("meetings").insert([
        {
          title,
          description: "",
          type: type === "1:1" ? "one_on_one" : "group",
          status: "scheduled",
          start_date: formattedDate,
          start_time: startTime,
          end_time: endTime,
          location,
          agenda,
          attendees: attendeesList.map(name => ({ name, email: "", status: "pending", required: true })),
          user_id: user.id,
          notes: "",
          action_items: [],
          attachments: [],
          is_recurring: false,
          reminder_minutes: 15,
          funding_source_id: isGrantMeeting && selectedFundingSourceId ? selectedFundingSourceId : null,
        }
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });

      // Reset form
      setTitle("");
      setType("1:1");
      setDate(undefined);
      setTime("10:00");
      setLocation("");
      setAttendees("");
      setAgenda("");
      setIsGrantMeeting(false);
      setSelectedFundingSourceId("");
      
      triggerRefresh('meetings');
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type *</label>
            <Select value={type} onValueChange={(value: "1:1" | "group") => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1 Meeting</SelectItem>
                <SelectItem value="group">Group Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">Time *</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Location *</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Meeting location"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Attendees</label>
            <Input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Enter attendee names (comma-separated)"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Agenda</label>
            <Textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Meeting agenda"
              rows={3}
            />
          </div>

          {/* Grant Meeting Toggle */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Grant Meeting</label>
              <Switch
                checked={isGrantMeeting}
                onCheckedChange={(checked) => {
                  setIsGrantMeeting(checked);
                  if (!checked) setSelectedFundingSourceId("");
                }}
              />
            </div>
            {isGrantMeeting && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Link to Grant *</label>
                <Select value={selectedFundingSourceId} onValueChange={setSelectedFundingSourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a grant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(fundingSources || []).map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} ({source.type})
                      </SelectItem>
                    ))}
                    {(!fundingSources || fundingSources.length === 0) && (
                      <SelectItem value="none" disabled>No grants available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
