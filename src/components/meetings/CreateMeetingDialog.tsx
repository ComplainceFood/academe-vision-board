
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Plus, Clock, Bell, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

export function CreateMeetingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"1:1" | "group">("1:1");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [attendees, setAttendees] = useState("");
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<"daily" | "weekly" | "monthly" | "custom">("weekly");
  const [reminder, setReminder] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<"5min" | "15min" | "30min" | "1hour" | "1day">("15min");
  const { user } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setTitle("");
    setType("1:1");
    setDate(new Date());
    setTime("");
    setDuration("30 min");
    setAttendees("");
    setLocation("");
    setAgenda("");
    setIsRecurring(false);
    setRecurringType("weekly");
    setReminder(false);
    setReminderTime("15min");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;

    try {
      setIsSubmitting(true);

      // Convert comma-separated attendees to array
      const attendeesList = attendees
        .split(',')
        .map(attendee => attendee.trim())
        .filter(attendee => attendee !== "");

      // Format date string in ISO format
      const dateString = date.toISOString();
      const formattedDate = format(date, 'yyyy-MM-dd');

      const { error } = await supabase.from("meetings").insert([
        {
          title,
          type,
          status: "scheduled",
          date: formattedDate,
          time,
          duration,
          attendees: attendeesList,
          location,
          user_id: user.id,
          notes: null,
          action_items: [],
          agenda,
          is_recurring: isRecurring,
          recurring_type: isRecurring ? recurringType : null,
          reminder_enabled: reminder,
          reminder_time: reminder ? reminderTime : null,
          participant_status: attendeesList.reduce((acc, attendee) => {
            acc[attendee] = "pending";
            return acc;
          }, {} as Record<string, string>),
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });

      setIsOpen(false);
      resetForm();
      
      // Trigger a refresh of the meetings list
      window.dispatchEvent(new Event("seedDataCompleted"));
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Schedule Meeting</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule New Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "1:1" | "group")}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="1:1">One-on-One</option>
              <option value="group">Group Meeting</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="15 min">15 minutes</option>
              <option value="30 min">30 minutes</option>
              <option value="45 min">45 minutes</option>
              <option value="60 min">1 hour</option>
              <option value="90 min">1.5 hours</option>
              <option value="120 min">2 hours</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees (comma-separated)</Label>
            <Input
              id="attendees"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="John Smith, Jane Doe"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office 302 or Online (Zoom)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Meeting goals and discussion points"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="recurring" 
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="recurring" className="cursor-pointer">Recurring Meeting</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="recurringType">Repeat</Label>
              <select
                id="recurringType"
                value={recurringType}
                onChange={(e) => setRecurringType(e.target.value as "daily" | "weekly" | "monthly" | "custom")}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="reminder" 
              checked={reminder}
              onCheckedChange={setReminder}
            />
            <Label htmlFor="reminder" className="cursor-pointer">Set Reminder</Label>
          </div>

          {reminder && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="reminderTime">Remind Before</Label>
              <select
                id="reminderTime"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value as "5min" | "15min" | "30min" | "1hour" | "1day")}
                className="w-full p-2 border rounded-md"
              >
                <option value="5min">5 minutes</option>
                <option value="15min">15 minutes</option>
                <option value="30min">30 minutes</option>
                <option value="1hour">1 hour</option>
                <option value="1day">1 day</option>
              </select>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
