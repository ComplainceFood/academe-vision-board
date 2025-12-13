import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Trash2, 
  Calendar,
  User,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from '@/types/notes';

interface TaskItemProps {
  task: Note;
  onToggleStatus: (id: string) => Promise<any>;
  onToggleStar: (id: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

const priorityStyles = {
  urgent: 'border-l-4 border-l-red-500 bg-red-500/5',
  high: 'border-l-4 border-l-orange-500 bg-orange-500/5',
  medium: 'border-l-4 border-l-blue-500',
  low: 'border-l-4 border-l-gray-300',
};

const priorityBadges = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function TaskItem({ task, onToggleStatus, onToggleStar, onDelete }: TaskItemProps) {
  const isCompleted = task.status === 'completed';

  return (
    <Card className={`group transition-all ${priorityStyles[task.priority]} ${isCompleted ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggleStatus(task.id)}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                {task.content && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.content}
                  </p>
                )}
              </div>

              {/* Star & Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onToggleStar(task.id)}
                >
                  <Star className={`h-4 w-4 ${task.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onToggleStatus(task.id)}>
                      {isCompleted ? 'Mark as pending' : 'Mark as complete'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStar(task.id)}>
                      {task.starred ? 'Remove star' : 'Add star'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className={`text-xs ${priorityBadges[task.priority]}`}>
                {task.priority}
              </Badge>
              {task.course && task.course !== 'General' && (
                <Badge variant="secondary" className="text-xs">
                  {task.course}
                </Badge>
              )}
              {task.student_name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {task.student_name}
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString()}
                </div>
              )}
              {task.tags && task.tags.length > 0 && task.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}