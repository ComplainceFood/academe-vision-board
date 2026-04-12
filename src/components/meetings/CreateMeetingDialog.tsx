import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Sparkles, Loader2, Wand2, Clock, CheckCircle2 } from "lucide-react";
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

  // AI agenda state
  const [isGeneratingAgenda, setIsGeneratingAgenda] = useState(false);
  const [agendaTopics, setAgendaTopics] = useState<{ item: string; duration_minutes: number; description: string }[]>([]);
  const [prepTips, setPrepTips] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerRefresh } = useRefreshContext();

  const { data: fundingSources } = useDataFetching<FundingSource>({
    table: 'funding_sources',
    enabled: !!user && isGrantMeeting,
  });

  const resetForm = () => {
    setTitle("");
    setType("1:1");
    setDate(undefined);
    setTime("10:00");
    setLocation("");
    setAttendees("");
    setAgenda("");
    setIsGrantMeeting(false);
    setSelectedFundingSourceId("");
    setAgendaTopics([]);
    setPrepTips([]);
    setEstimatedMinutes(null);
  };

  const handleGenerateAgenda = async () => {
    if (!title.trim()) {
      toast({ title: "Enter a meeting title first", variant: "destructive" });
      return;
    }
    setIsGeneratingAgenda(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meeting-agenda", {
        body: {
          title,
          type: type === "1:1" ? "one_on_one" : "group",
          attendees,
          purpose: title,
          date: date ? format(date, "yyyy-MM-dd") : undefined,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.agenda) setAgenda(data.agenda);
      if (data.topics?.length) setAgendaTopics(data.topics);
      if (data.preparation_tips?.length) setPrepTips(data.preparation_tips);
      if (data.estimated_total_minutes) setEstimatedMinutes(data.estimated_total_minutes);

      toast({ title: "Agenda generated", description: "Review and edit the agenda below." });
    } catch (err) {
      console.error("Agenda generation error:", err);
      toast({ title: "Failed to generate agenda", description: "Please write the agenda manually.", variant: "destructive" });
    } finally {
      setIsGeneratingAgenda(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !location || !user) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (isGrantMeeting && !selectedFundingSourceId) {
      toast({ title: "Error", description: "Please select a grant to link this meeting to", variant: "destructive" });
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
      const endHours = hours >= 23 ? 23 : hours + 1;
      const endMinutes = hours >= 23 ? 59 : minutes;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

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

      toast({ title: "Success", description: "Meeting scheduled successfully" });
      resetForm();
      triggerRefresh('meetings');
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({ title: "Error", description: "Failed to schedule meeting", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
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
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
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

          {/* AI Agenda Generator */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Agenda Generator</span>
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateAgenda}
                disabled={isGeneratingAgenda || !title.trim()}
                className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                {isGeneratingAgenda
                  ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Generating…</>
                  : <><Wand2 className="h-3 w-3 mr-1" />Generate Agenda</>}
              </Button>
            </div>

            {/* Duration estimate */}
            {estimatedMinutes && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Estimated duration: ~{estimatedMinutes} minutes</span>
              </div>
            )}

            {/* Topic breakdown */}
            {agendaTopics.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Agenda breakdown:</p>
                <div className="rounded-lg border border-primary/10 bg-background divide-y">
                  {agendaTopics.map((topic, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{topic.item}</p>
                        {topic.description && (
                          <p className="text-[11px] text-muted-foreground truncate">{topic.description}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-primary font-semibold shrink-0 bg-primary/10 rounded px-1.5 py-0.5">
                        {topic.duration_minutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prep tips */}
            {prepTips.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Preparation tips:</p>
                {prepTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Agenda</label>
            <Textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Meeting agenda (or use AI to generate one above)"
              rows={4}
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
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
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
