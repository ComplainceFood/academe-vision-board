import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Repeat, Repeat1, Repeat2 } from 'lucide-react';
import { RECURRENCE_LABELS, RecurrencePattern } from '@/types/notes';
import { cn } from '@/lib/utils';

interface RecurringTaskBadgeProps {
  pattern: RecurrencePattern | null | undefined;
  endDate?: string | null;
  compact?: boolean;
}

export function RecurringTaskBadge({ pattern, endDate, compact = false }: RecurringTaskBadgeProps) {
  if (!pattern) return null;

  const getIcon = () => {
    switch (pattern) {
      case 'daily':
        return Repeat1;
      case 'weekly':
      case 'biweekly':
        return Repeat;
      case 'monthly':
        return Repeat2;
      default:
        return Repeat;
    }
  };

  const Icon = getIcon();

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={`Repeats ${RECURRENCE_LABELS[pattern]}`}>
        <Icon className="h-3 w-3" />
      </span>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800")}>
      <Icon className="h-3 w-3" />
      {RECURRENCE_LABELS[pattern]}
      {endDate && (
        <span className="text-muted-foreground ml-1">
          until {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </Badge>
  );
}
