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
      "px-3 py-2.5 transition-all duration-200 hover:shadow-sm group border-l-4",
      config.border,
      event.completed && "opacity-60"
    )}>
      <div className="flex items-center gap-2.5">
        {/* Type icon */}
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className={cn(
              "font-medium text-xs leading-snug truncate",
              event.completed && "line-through text-muted-foreground"
            )}>
              {event.title}
            </h3>

            {/* Actions */}
            <div className="flex items-center shrink-0">
              {event.type === 'task' && onToggleCompletion && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onToggleCompletion(event.id!, !event.completed)}
                >
                  {event.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onEdit(event)} className="gap-2 text-xs">
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  {event.type === 'task' && onToggleCompletion && (
                    <DropdownMenuItem
                      onClick={() => onToggleCompletion(event.id!, !event.completed)}
                      className="gap-2 text-xs"
                    >
                      {event.completed ? (
                        <><Circle className="h-3.5 w-3.5" />Mark Incomplete</>
                      ) : (
                        <><CheckCircle2 className="h-3.5 w-3.5" />Mark Complete</>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2 text-xs"
                    onClick={() => onDelete(event.id!)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            <span className="flex items-center gap-0.5">
              <CalendarIcon className="h-2.5 w-2.5" />
              {formattedDate}
            </span>
            {event.time && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {event.time}
              </span>
            )}
            {event.course && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
                {event.course}
              </Badge>
            )}
          </div>

          {event.description && (
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
