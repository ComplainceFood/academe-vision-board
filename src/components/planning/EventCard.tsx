import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Circle,
  MapPin,
  Edit2,
  Trash2
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
  const typeConfig = {
    deadline: { 
      icon: AlertCircle, 
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-l-destructive"
    },
    event: { 
      icon: CalendarDays, 
      color: "text-secondary",
      bg: "bg-secondary/10",
      border: "border-l-secondary"
    },
    task: { 
      icon: FileText, 
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-l-accent"
    },
    meeting: { 
      icon: Clock, 
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-l-primary"
    }
  };

  const config = typeConfig[event.type as keyof typeof typeConfig] || typeConfig.event;
  const Icon = config.icon;
  const formattedDate = format(new Date(`${event.date}T00:00:00`), "EEE, MMM d");
  
  return (
    <Card className={cn(
      "p-4 transition-all duration-200 hover:shadow-md group border-l-4",
      config.border,
      event.completed && "opacity-60"
    )}>
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={cn(
                "font-medium text-sm leading-snug mb-1",
                event.completed && "line-through text-muted-foreground"
              )}>
                {event.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formattedDate}
                </span>
                {event.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </span>
                )}
                {event.course && (
                  <Badge variant="outline" className="text-xs h-5">
                    {event.course}
                  </Badge>
                )}
              </div>
              
              {event.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              {event.type === 'task' && onToggleCompletion && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onToggleCompletion(event.id!, !event.completed)}
                >
                  {event.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit(event)} className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {event.type === 'task' && onToggleCompletion && (
                    <DropdownMenuItem 
                      onClick={() => onToggleCompletion(event.id!, !event.completed)}
                      className="gap-2"
                    >
                      {event.completed ? (
                        <>
                          <Circle className="h-4 w-4" />
                          Mark Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Complete
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive gap-2" 
                    onClick={() => onDelete(event.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
