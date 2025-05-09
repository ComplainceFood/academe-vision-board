
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PlanningEvent } from "@/services/planningService";
import { EventCard } from "./EventCard";
import { addMonths, format, getDay, getDaysInMonth, isToday, startOfMonth, subMonths } from "date-fns";

interface PlanningCalendarProps {
  events: PlanningEvent[];
  onEditEvent: (event: PlanningEvent) => void;
  onDeleteEvent: (id: string) => void;
  onToggleCompletion: (id: string, completed: boolean) => void;
}

export function PlanningCalendar({ 
  events, 
  onEditEvent, 
  onDeleteEvent, 
  onToggleCompletion 
}: PlanningCalendarProps) {
  // Get current date
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Calendar navigation
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Filter events from the current month and the next 30 days
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const nextMonthStart = addMonths(currentMonthStart, 1);
  const upcomingEvents = sortedEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= new Date();
  }).slice(0, 5);
  
  // Generate calendar days
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getDay(startOfMonth(currentDate));
    
    // Create array of days
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border/30 p-1"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = format(date, "yyyy-MM-dd");
      const dayEvents = events.filter(event => event.date === dateString);
      const isCurrentDay = isToday(date);
      
      days.push(
        <div key={day} className={cn(
          "h-24 border border-border/30 p-1 overflow-hidden relative",
          isCurrentDay ? "bg-primary/5 border-primary/30" : ""
        )}>
          <div className={cn(
            "absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-xs",
            isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"
          )}>
            {day}
          </div>
          <div className="mt-5 space-y-1">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div key={idx} 
                className={cn(
                  "text-xs truncate px-1 py-0.5 rounded cursor-pointer",
                  event.type === 'deadline' ? 'bg-destructive/15 text-destructive' : 
                  event.type === 'event' ? 'bg-secondary/15 text-secondary' : 
                  event.type === 'task' ? 'bg-accent/15 text-accent' : 
                  'bg-primary/15 text-primary'
                )}
                onClick={() => onEditEvent(event)}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 mb-2">
        {weekdays.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-0 mb-6">
        {renderCalendar()}
      </div>
      
      <div>
        <h3 className="font-medium text-lg mb-3">Upcoming Events</h3>
        <div className="space-y-2">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onEdit={onEditEvent} 
                onDelete={onDeleteEvent} 
                onToggleCompletion={onToggleCompletion}
              />
            ))
          ) : (
            <p className="text-center py-6 text-muted-foreground">No upcoming events</p>
          )}
        </div>
      </div>
    </div>
  );
}
