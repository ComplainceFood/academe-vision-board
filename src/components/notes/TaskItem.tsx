import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Trash2, 
  User,
  MoreHorizontal,
  Edit,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from '@/types/notes';
import { SubtaskManager } from './SubtaskManager';
import { SmartDeadlineIndicator } from './SmartDeadlineIndicator';
import { RecurringTaskBadge } from './RecurringTaskBadge';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Note;
  onToggleStatus: (id: string) => Promise<unknown>;
  onToggleStar: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onEdit?: (task: Note) => void;
  onUpdateSubtasks?: (noteId: string, subtasks: Note['subtasks']) => Promise<unknown>;
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

export function TaskItem({ task, onToggleStatus, onToggleStar, onDelete, onEdit, onUpdateSubtasks }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const subtaskProgress = hasSubtasks 
    ? `${task.subtasks!.filter(s => s.completed).length}/${task.subtasks!.length}`
    : null;

  return (
    <Card className={cn(
      "group transition-all",
      priorityStyles[task.priority],
      isCompleted && 'opacity-60'
    )}>
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
                <div className="flex items-center gap-2">
                  {hasSubtasks && (
                    <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-0.5 hover:bg-muted rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                  <h3 className={cn(
                    "font-medium",
                    isCompleted && 'line-through text-muted-foreground'
                  )}>
                    {task.title}
                  </h3>
                </div>
                {task.content && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.content}
                  </p>
                )}
              </div>

              {/* Star & Actions */}
              <div className="flex items-center gap-1">
                {task.starred && (
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                )}
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
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onToggleStatus(task.id)}>
                      {isCompleted ? 'Mark as pending' : 'Mark as complete'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStar(task.id)}>
                      <Star className={`h-4 w-4 mr-2 ${task.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      {task.starred ? 'Remove star' : 'Add star'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
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
              
              {/* Smart Deadline */}
              <SmartDeadlineIndicator dueDate={task.due_date} status={task.status} />
              
              {/* Recurring Badge */}
              <RecurringTaskBadge 
                pattern={task.recurrence_pattern as 'daily' | 'weekly' | 'biweekly' | 'monthly' | null} 
                endDate={task.recurrence_end_date}
              />
              
              {/* Subtask Progress */}
              {subtaskProgress && (
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                  ✓ {subtaskProgress}
                </Badge>
              )}
              
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
              {task.tags && task.tags.length > 0 && task.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Expanded Subtasks */}
            {isExpanded && hasSubtasks && onUpdateSubtasks && (
              <div className="mt-3 pt-3 border-t">
                <SubtaskManager
                  subtasks={task.subtasks!}
                  onChange={(subtasks) => onUpdateSubtasks(task.id, subtasks)}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
