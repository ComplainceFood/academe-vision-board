import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, GripVertical } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Subtask } from '@/types/notes';
import { cn } from '@/lib/utils';

interface SubtaskManagerProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function SubtaskManager({ subtasks, onChange, readOnly = false, compact = false }: SubtaskManagerProps) {
  const [newSubtask, setNewSubtask] = useState('');

  const completedCount = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const newItem: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtask.trim(),
      completed: false,
    };
    onChange([...subtasks, newItem]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    onChange(subtasks.map(s => 
      s.id === id ? { ...s, completed: !s.completed } : s
    ));
  };

  const removeSubtask = (id: string) => {
    onChange(subtasks.filter(s => s.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  if (compact && subtasks.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedCount}/{subtasks.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div 
            key={subtask.id}
            className={cn(
              "flex items-center gap-2 group",
              compact ? "py-0.5" : "py-1"
            )}
          >
            {!readOnly && !compact && (
              <GripVertical className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
            )}
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => toggleSubtask(subtask.id)}
              disabled={readOnly}
              className="h-4 w-4"
            />
            <span 
              className={cn(
                "flex-1 text-sm",
                subtask.completed && "line-through text-muted-foreground"
              )}
            >
              {subtask.title}
            </span>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => removeSubtask(subtask.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add new subtask */}
      {!readOnly && !compact && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a subtask..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={addSubtask}
            disabled={!newSubtask.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
