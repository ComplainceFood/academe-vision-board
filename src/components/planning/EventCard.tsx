
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertCircle, 
  CalendarDays, 
  Clock, 
  FileText, 
  MoreVertical, 
  Calendar as CalendarIcon, 
  CheckCircle2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanningEvent } from "@/services/planningService";
import { format } from "date-fns";

interface EventCardProps {
  event: PlanningEvent;
  onEdit: (event: PlanningEvent) => void;
  onDelete: (id: string) => void;
  onToggleCompletion?: (id: string, completed: boolean) => void;
}

export function EventCard({ event, onEdit, onDelete, onToggleCompletion }: EventCardProps) {
  const eventTypeStyles = {
    deadline: "bg-destructive/15 text-destructive border-destructive/20",
    event: "bg-secondary/15 text-secondary border-secondary/20",
    task: "bg-accent/15 text-accent border-accent/20",
    meeting: "bg-primary/15 text-primary border-primary/20"
  };
  
  const eventTypeIcons = {
    deadline: <AlertCircle className="h-4 w-4" />,
    event: <CalendarDays className="h-4 w-4" />,
    task: <FileText className="h-4 w-4" />,
    meeting: <Clock className="h-4 w-4" />
  };

  const formattedDate = format(new Date(`${event.date}T00:00:00`), "PPP");
  
  return (
    <Card className={`mb-3 border-l-4 ${event.type === 'deadline' ? 'border-l-destructive' : event.type === 'event' ? 'border-l-secondary' : event.type === 'task' ? 'border-l-accent' : 'border-l-primary'} glassmorphism`}>
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div>
          <div className="flex flex-wrap gap-2 items-center mb-1">
            <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${eventTypeStyles[event.type]}`}>
              {eventTypeIcons[event.type]}
              <span className="capitalize">{event.type}</span>
            </span>
            
            {event.course && (
              <span className="text-xs bg-muted px-2 py-1 rounded">
                {event.course}
              </span>
            )}
            
            {event.type === 'task' && (
              <span className={`text-xs px-2 py-1 rounded ${event.completed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {event.completed ? 'Completed' : 'Pending'}
              </span>
            )}
            
            {event.priority && (
              <Badge variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'outline' : 'secondary'}>
                {event.priority} priority
              </Badge>
            )}
          </div>
          
          <h3 className="text-base font-medium">{event.title}</h3>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(event)}>Edit</DropdownMenuItem>
            {event.type === 'task' && onToggleCompletion && (
              <DropdownMenuItem 
                onClick={() => onToggleCompletion(event.id, !event.completed)}
              >
                {event.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive" 
              onClick={() => onDelete(event.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {event.description && (
          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
        )}
        
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>{formattedDate}</span>
          {event.time && (
            <>
              <span className="mx-1">•</span>
              <Clock className="h-3 w-3 mr-1" />
              <span>{event.time}</span>
            </>
          )}
        </div>
        
        {event.type === 'task' && onToggleCompletion && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-8 px-2 text-xs", 
                event.completed ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-orange-50 text-orange-700 hover:bg-orange-100"
              )}
              onClick={() => onToggleCompletion(event.id, !event.completed)}
            >
              {event.completed ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
              ) : (
                <><X className="h-3 w-3 mr-1" /> Pending</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
