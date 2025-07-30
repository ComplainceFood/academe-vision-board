
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { FutureTask } from "@/services/planningService";

interface FutureTaskCardProps {
  task: FutureTask;
  onEdit: (task: FutureTask) => void;
  onDelete: (id: string) => void;
}

export function FutureTaskCard({ task, onEdit, onDelete }: FutureTaskCardProps) {
  const priorityColors = {
    high: "bg-destructive/15 text-destructive",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-green-100 text-green-700"
  };
  
  return (
    <Card className="mb-3 glassmorphism">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div>
          <div className="flex flex-wrap gap-2 items-center mb-1">
            <span className="text-xs bg-muted px-2 py-1 rounded">{task.semester}</span>
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>
              {task.priority} priority
            </span>
            {task.estimated_hours !== undefined && (
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                ~{task.estimated_hours} hours
              </span>
            )}
          </div>
          <h3 className="text-base font-medium">{task.title}</h3>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive" 
              onClick={() => onDelete(task.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
    </Card>
  );
}
