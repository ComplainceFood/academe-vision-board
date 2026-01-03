import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Clock, Edit2, Trash2 } from "lucide-react";
import { FutureTask } from "@/services/planningService";
import { cn } from "@/lib/utils";

interface FutureTaskCardProps {
  task: FutureTask;
  onEdit: (task: FutureTask) => void;
  onDelete: (id: string) => void;
}

export function FutureTaskCard({ task, onEdit, onDelete }: FutureTaskCardProps) {
  const priorityConfig = {
    high: { 
      color: "bg-destructive/10 text-destructive border-destructive/20",
      dot: "bg-destructive"
    },
    medium: { 
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      dot: "bg-orange-500"
    },
    low: { 
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      dot: "bg-green-500"
    }
  };

  const config = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  
  return (
    <Card className={cn(
      "p-4 transition-all duration-200 hover:shadow-md border-l-4 group",
      task.priority === 'high' ? 'border-l-destructive' :
      task.priority === 'medium' ? 'border-l-orange-500' :
      'border-l-green-500'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={cn("text-xs font-medium", config.color)}>
              {task.priority} priority
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {task.semester}
            </Badge>
            {task.estimated_hours !== undefined && task.estimated_hours > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {task.estimated_hours}h
              </Badge>
            )}
          </div>
          
          <h3 className="font-medium text-base leading-snug">{task.title}</h3>
        </div>
        
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
            <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive gap-2" 
              onClick={() => onDelete(task.id!)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
