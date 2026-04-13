import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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
        <div key={`empty-${i}`} className="h-14 md:h-16 p-1 bg-muted/20 rounded-md" />
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
            "h-14 md:h-16 p-1 rounded-md cursor-pointer transition-all duration-200 relative group",
            isCurrentDay && "ring-2 ring-primary ring-offset-1 ring-offset-background",
            isSelected && "bg-primary/10",
            !isCurrentDay && !isSelected && "hover:bg-muted/50"
          )}
          onClick={() => setSelectedDate(dateString)}
        >
          <div className={cn(
            "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-0.5",
            isCurrentDay ? "bg-primary text-primary-foreground" : ""
          )}>
            {day}
          </div>

          {/* Event labels - desktop */}
          <div className="flex flex-col gap-0.5">
            {dayEvents.slice(0, 1).map((event, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-[10px] truncate px-1 py-px rounded font-medium hidden md:block w-full",
                  event.type === 'deadline' ? 'bg-destructive/15 text-destructive' :
                  event.type === 'event' ? 'bg-secondary/15 text-secondary' :
                  event.type === 'task' ? 'bg-accent/15 text-accent' :
                  'bg-primary/15 text-primary'
                )}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 1 && (
              <span className="text-[10px] text-muted-foreground hidden md:block pl-1">
                +{dayEvents.length - 1}
              </span>
            )}
          </div>

          {/* Mobile dot indicators */}
          <div className="flex gap-0.5 mt-0.5 md:hidden">
            {hasDeadline && <div className="h-1 w-1 rounded-full bg-destructive" />}
            {hasMeeting && <div className="h-1 w-1 rounded-full bg-primary" />}
            {hasTask && <div className="h-1 w-1 rounded-full bg-accent" />}
            {hasEvent && <div className="h-1 w-1 rounded-full bg-secondary" />}
          </div>
        </div>
      );
    }

    return days;
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendar Grid */}
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-base font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {events.filter(e => isSameMonth(new Date(`${e.date}T00:00:00`), currentDate)).length} events this month
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekdays.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium py-1 text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {renderCalendar()}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
          {[
            { color: 'bg-destructive', label: 'Deadline' },
            { color: 'bg-primary', label: 'Meeting' },
            { color: 'bg-accent', label: 'Task' },
            { color: 'bg-secondary', label: 'Event' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar - Selected Date or Upcoming */}
      <div className="space-y-2">
        {selectedDate && selectedDateEvents.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">
                  {format(new Date(`${selectedDate}T00:00:00`), "EEE, MMM d")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedDate(null)}>
                Clear
              </Button>
            </div>
            <div className="space-y-2">
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
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Upcoming Events
              </h4>
              <p className="text-xs text-muted-foreground">Next on your schedule</p>
            </div>
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
                <div className="text-center py-5 px-3 bg-muted/30 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                  <p className="text-xs text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
