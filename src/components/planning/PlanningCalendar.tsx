import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { PlanningEvent } from "@/services/planningService";
import { EventCard } from "./EventCard";
import { addMonths, format, getDay, getDaysInMonth, isToday, startOfMonth, subMonths, isSameMonth } from "date-fns";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };
  
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  const upcomingEvents = sortedEvents.filter(event => {
    const eventDate = new Date(`${event.date}T00:00:00`);
    return eventDate >= new Date();
  }).slice(0, 5);

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate)
    : [];
  
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getDay(startOfMonth(currentDate));
    
    const days = [];
    
    // Empty cells for days before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 md:h-24 p-1 bg-muted/20 rounded-lg" />
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = format(date, "yyyy-MM-dd");
      const dayEvents = events.filter(event => event.date === dateString);
      const isCurrentDay = isToday(date);
      const isSelected = selectedDate === dateString;
      
      const hasDeadline = dayEvents.some(e => e.type === 'deadline');
      const hasMeeting = dayEvents.some(e => e.type === 'meeting');
      const hasTask = dayEvents.some(e => e.type === 'task');
      const hasEvent = dayEvents.some(e => e.type === 'event');
      
      days.push(
        <div 
          key={day} 
          className={cn(
            "h-20 md:h-24 p-1.5 rounded-lg cursor-pointer transition-all duration-200 relative group",
            isCurrentDay && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            isSelected && "bg-primary/10",
            !isCurrentDay && !isSelected && "hover:bg-muted/50"
          )}
          onClick={() => setSelectedDate(dateString)}
        >
          <div className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1",
            isCurrentDay ? "bg-primary text-primary-foreground" : ""
          )}>
            {day}
          </div>
          
          {/* Event indicators */}
          <div className="flex flex-wrap gap-1">
            {dayEvents.slice(0, 2).map((event, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "text-xs truncate px-1.5 py-0.5 rounded font-medium hidden md:block max-w-full",
                  event.type === 'deadline' ? 'bg-destructive/15 text-destructive' : 
                  event.type === 'event' ? 'bg-secondary/15 text-secondary' : 
                  event.type === 'task' ? 'bg-accent/15 text-accent' : 
                  'bg-primary/15 text-primary'
                )}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <span className="text-xs text-muted-foreground hidden md:block">
                +{dayEvents.length - 2}
              </span>
            )}
          </div>
          
          {/* Mobile indicators */}
          <div className="flex gap-1 mt-1 md:hidden">
            {hasDeadline && <div className="h-1.5 w-1.5 rounded-full bg-destructive" />}
            {hasMeeting && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
            {hasTask && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
            {hasEvent && <div className="h-1.5 w-1.5 rounded-full bg-secondary" />}
          </div>
        </div>
      );
    }
    
    return days;
  };
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {events.filter(e => isSameMonth(new Date(`${e.date}T00:00:00`), currentDate)).length} events this month
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((day, index) => (
            <div key={index} className="text-center text-sm font-medium py-2 text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Deadline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Meeting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-xs text-muted-foreground">Event</span>
          </div>
        </div>
      </div>
      
      {/* Sidebar - Selected Date or Upcoming */}
      <div className="space-y-4">
        {selectedDate && selectedDateEvents.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">
                  {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMM d")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                Clear
              </Button>
            </div>
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEdit={onEditEvent} 
                  onDelete={onDeleteEvent} 
                  onToggleCompletion={onToggleCompletion}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Events
              </h4>
              <p className="text-sm text-muted-foreground">Next on your schedule</p>
            </div>
            <div className="space-y-3">
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
                <div className="text-center py-8 px-4 bg-muted/30 rounded-xl">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
