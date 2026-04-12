import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuth } from "@/hooks/useAuth";
import { useDataFetching } from "@/hooks/useDataFetching";
import { FundingSource } from "@/types/funding";
import type { Meeting } from "@/types/meetings";

interface EditMeetingDialogProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMeetingDialog({ meeting, open, onOpenChange }: EditMeetingDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"one_on_one" | "group">("one_on_one");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [agenda, setAgenda] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGrantMeeting, setIsGrantMeeting] = useState(false);
  const [selectedFundingSourceId, setSelectedFundingSourceId] = useState<string>("");
  
  const { toast } = useToast();
  const { updateMeeting } = useMeetings();
  const { user } = useAuth();

  const { data: fundingSources } = useDataFetching<FundingSource>({
    table: 'funding_sources',
    enabled: !!user && isGrantMeeting,
  });

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      // Normalize type: only "one_on_one" and "group" are editable; others default to "one_on_one"
      setType(meeting.type === "group" ? "group" : "one_on_one");
      // Parse date as local time to avoid off-by-one in negative-offset timezones
      setDate(new Date(meeting.start_date + 'T00:00:00'));
      setStartTime(meeting.start_time);
      setEndTime(meeting.end_time);
      setLocation(meeting.location);
      setAttendees(meeting.attendees?.map(a => a.name).join(', ') || '');
      setAgenda(meeting.agenda || '');
      setIsGrantMeeting(!!meeting.funding_source_id);
      setSelectedFundingSourceId(meeting.funding_source_id || "");
    }
  }, [meeting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meeting || !title || !date || !location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isGrantMeeting && !selectedFundingSourceId) {
      toast({
        title: "Error",
        description: "Please select a grant to link this meeting to",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Preserve existing attendee statuses; only new names default to "pending"
      const existingByName = Object.fromEntries(
        (meeting.attendees || []).map(a => [a.name, a])
      );
      const attendeesList = attendees
        .split(',')
        .map(attendee => attendee.trim())
        .filter(attendee => attendee !== "")
        .map(name => existingByName[name]
          ? { ...existingByName[name] }
          : { name, email: "", status: "pending" as const, required: true }
        );

      const formattedDate = format(date, 'yyyy-MM-dd');
      
      await updateMeeting({
        id: meeting.id,
        updates: {
          title,
          type,
          start_date: formattedDate,
          start_time: startTime,
          end_time: endTime,
          location,
          agenda,
          attendees: attendeesList,
          funding_source_id: isGrantMeeting && selectedFundingSourceId ? selectedFundingSourceId : null,
        },
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating meeting:", error);
      toast({
        title: "Error",
        description: "Failed to update meeting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!meeting) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
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
            <Select value={type} onValueChange={(value: "one_on_one" | "group") => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_on_one">1:1 Meeting</SelectItem>
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
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Start</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">End</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
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
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
