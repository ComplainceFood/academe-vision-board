import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize the time field with the current time rounded to nearest 15 minutes
  useEffect(() => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    setTime(now.toTimeString().substring(0, 5));
  }, []);

  const resetForm = () => {
    setTitle("");
    setType("1:1");
    setDate(new Date());
    // Keep time as is
    setDuration("30 min");
    setAttendees("");
    setLocation("");
    setAgenda("");
    setIsRecurring(false);
    setRecurringType("weekly");
    setReminder(false);
    setReminderTime("15min");
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) errors.title = "Title is required";
    if (!date) errors.date = "Date is required";
    if (!time) errors.time = "Time is required";
    if (!location.trim()) errors.location = "Location is required";
    if (!attendees.trim()) errors.attendees = "At least one attendee is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;
    
    // Validate the form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

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
            <Label htmlFor="title" className="flex items-center">
              Meeting Title
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) {
                  setFormErrors({...formErrors, title: ""});
                }
              }}
              className={formErrors.title ? "border-destructive" : ""}
            />
            {formErrors.title && (
              <p className="text-destructive text-sm">{formErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as "1:1" | "group")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">One-on-One</SelectItem>
                <SelectItem value="group">Group Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center">
                Date
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${formErrors.date ? "border-destructive" : ""}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      setDate(date);
                      setFormErrors({...formErrors, date: ""});
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formErrors.date && (
                <p className="text-destructive text-sm">{formErrors.date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center">
                Time
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setFormErrors({...formErrors, time: ""});
                }}
                className={formErrors.time ? "border-destructive" : ""}
              />
              {formErrors.time && (
                <p className="text-destructive text-sm">{formErrors.time}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={duration}
              onValueChange={setDuration}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15 min">15 minutes</SelectItem>
                <SelectItem value="30 min">30 minutes</SelectItem>
                <SelectItem value="45 min">45 minutes</SelectItem>
                <SelectItem value="60 min">1 hour</SelectItem>
                <SelectItem value="90 min">1.5 hours</SelectItem>
                <SelectItem value="120 min">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attendees" className="flex items-center">
              Attendees (comma-separated)
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="attendees"
              value={attendees}
              onChange={(e) => {
                setAttendees(e.target.value);
                if (e.target.value.trim()) {
                  setFormErrors({...formErrors, attendees: ""});
                }
              }}
              placeholder="John Smith, Jane Doe"
              className={formErrors.attendees ? "border-destructive" : ""}
            />
            {formErrors.attendees && (
              <p className="text-destructive text-sm">{formErrors.attendees}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              Location
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (e.target.value.trim()) {
                  setFormErrors({...formErrors, location: ""});
                }
              }}
              placeholder="Office 302 or Online (Zoom)"
              className={formErrors.location ? "border-destructive" : ""}
            />
            {formErrors.location && (
              <p className="text-destructive text-sm">{formErrors.location}</p>
            )}
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
              <Select
                value={recurringType}
                onValueChange={(value) => setRecurringType(value as "daily" | "weekly" | "monthly" | "custom")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
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
              <Select
                value={reminderTime}
                onValueChange={(value) => setReminderTime(value as "5min" | "15min" | "30min" | "1hour" | "1day")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reminder time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">5 minutes</SelectItem>
                  <SelectItem value="15min">15 minutes</SelectItem>
                  <SelectItem value="30min">30 minutes</SelectItem>
                  <SelectItem value="1hour">1 hour</SelectItem>
                  <SelectItem value="1day">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-4">Fields marked with <span className="text-destructive">*</span> are required</p>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
